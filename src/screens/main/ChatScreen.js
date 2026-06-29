import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import useAppStore from '../../store/useAppStore';
import { Image } from 'expo-image';

export default function ChatScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { profile, chatRooms, addMessage, updateMessageStatus, markRoomAsRead, selectedOpponent } = useAppStore();
  
  const initialOpponent = route.params?.opponent || selectedOpponent || {
    id: 'opp_1',
    name: 'Marcus V.',
    avatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
    is_online: false
  };
  
  const [currentOpponent, setCurrentOpponent] = useState(initialOpponent);
  const roomId = `${profile?.id}_${currentOpponent.id}`;
  const messages = chatRooms[roomId] || [];

  // Dynamic timestamps relative to current real time
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (timestampStr) => {
    if (!timestampStr) return '';
    let date;
    
    if (timestampStr.includes('T')) {
       date = new Date(timestampStr);
    } else {
       const [hours, minutes] = timestampStr.split(':');
       date = new Date();
       date.setUTCHours(parseInt(hours, 10));
       date.setUTCMinutes(parseInt(minutes, 10));
    }
    
    // Gunakan getHours() agar zona waktu lokal (misal WIB +7) terbaca dengan akurat di semua HP
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}.${m}`;
  };

  const getAvatarUrl = (avatarStr) => {
    if (!avatarStr || avatarStr === "null") return 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
    if (avatarStr.includes('gravatar.com') || avatarStr.startsWith('file://') || avatarStr.startsWith('content://')) return avatarStr;
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
    
    // Auto-fix any absolute URLs from previous local tests (e.g. 192.168.x.x, 10.0.2.2, etc.)
    let cleanStr = avatarStr;
    if (cleanStr.includes('/uploads/')) {
        const urlParts = cleanStr.split('/uploads/');
        if (urlParts.length > 1) {
            cleanStr = '/uploads/' + urlParts[1];
        }
    }

    try {
      const urlObj = new URL(cleanStr);
      return `${apiUrl}${urlObj.pathname}${urlObj.search}`;
    } catch (e) {
      return cleanStr.startsWith('/') ? `${apiUrl}${cleanStr}` : `${apiUrl}/${cleanStr}`;
    }
  };

  const socket = useAppStore(state => state.socket);
  const connectWebSocket = useAppStore(state => state.connectWebSocket);
  const disconnectWebSocket = useAppStore(state => state.disconnectWebSocket);
  const setChatRoomMessages = useAppStore(state => state.setChatRoomMessages);

  useEffect(() => {
    // 1. Fetch chat history and opponent status
    const fetchHistoryAndStatus = async () => {
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
        
        // Fetch Messages
        const msgResponse = await fetch(`${apiUrl}/messages/${profile?.id}/${currentOpponent.id}?t=${Date.now()}`);
        if (msgResponse.ok) {
          const data = await msgResponse.json();
          const formattedMessages = data.map(msg => {
            const isFromMe = String(msg.sender_id) === String(profile?.id);
            return {
              id: String(msg.id),
              text: msg.text,
              sender: isFromMe ? 'user' : 'opponent',
              timestamp: new Date(msg.created_at + (msg.created_at.includes('Z') ? '' : 'Z')).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
              status: msg.status
            };
          });
          setChatRoomMessages(roomId, formattedMessages);
        }
        
        // Fetch Opponent Profile for Real-time Status/Avatar
        const userResp = await fetch(`${apiUrl}/users/${currentOpponent.id}?t=${Date.now()}`);
        if (userResp.ok) {
           const userData = await userResp.json();
           setCurrentOpponent(prev => ({
             ...prev,
             is_online: userData.is_online,
             avatar: userData.avatar,
             name: userData.full_name || userData.username || prev.name
           }));
        }
      } catch (error) {
        console.error("Failed to fetch chat history/status", error);
      }
    };
    
    fetchHistoryAndStatus();
    
    // 3. Fallback: HTTP Polling (Setiap 1 detik)
    const pollInterval = setInterval(() => {
      fetchHistoryAndStatus();
    }, 1000);
    
    if (chatRooms[roomId] && chatRooms[roomId].length > 0) {
      markRoomAsRead(roomId);
    }
    
    return () => {
      disconnectWebSocket();
      clearInterval(pollInterval);
    };
  }, []);

  const [messagesLocal, setMessagesLocal] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  
  // Fitur Hapus Pesan
  const [selectedMessages, setSelectedMessages] = useState([]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (inputText.trim() === '') return;

    const payload = {
      receiver_id: currentOpponent.id,
      sender_id: profile?.id, // HTTP needs sender_id
      text: inputText
    };

    // Optimistic UI update
    const tempMsg = {
      id: 'temp_' + Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };
    addMessage(roomId, tempMsg);
    setInputText('');

    if (socket && socket.readyState === WebSocket.OPEN) {
      // Jalur Cepat (WebSocket)
      socket.send(JSON.stringify(payload));
    } else {
      // Jalur HTTP Fallback (Anti-Error cPanel)
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
        await fetch(`${apiUrl}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error("HTTP Message Send Error:", err);
      }
    }
  };

  // --- Logic Hapus Pesan ---
  const toggleMessageSelection = (msgId) => {
    setSelectedMessages(prev => {
      if (prev.includes(msgId)) {
        return prev.filter(id => id !== msgId);
      } else {
        return [...prev, msgId];
      }
    });
  };

  const deleteSelectedMessages = async () => {
    if (selectedMessages.length === 0) return;
    
    // Hapus dari UI sementara (Optimistic UI)
    const prevMessages = [...messages];
    setMessages(msgs => msgs.filter(m => !selectedMessages.includes(m.id)));
    
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      const response = await fetch(`${apiUrl}/messages`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_ids: selectedMessages.map(id => parseInt(id)) })
      });
      
      if (!response.ok) throw new Error("Gagal menghapus pesan");
      setSelectedMessages([]);
    } catch (err) {
      console.error("Delete Error:", err);
      // Revert if failed
      setMessages(prevMessages);
      Alert.alert("Error", "Gagal menghapus pesan, silakan coba lagi.");
    }
  };

  const confirmDeleteMessages = () => {
    Alert.alert(
      "Hapus Pesan",
      `Apakah Anda yakin ingin menghapus ${selectedMessages.length} pesan ini?`,
      [
        { text: "Batal", style: "cancel" },
        { text: "Hapus", style: "destructive", onPress: deleteSelectedMessages }
      ]
    );
  };
  // -------------------------

  const renderItem = ({ item }) => {
    const isUser = item.sender === 'user';
    const isSelected = selectedMessages.includes(item.id);
    
    return (
      <TouchableOpacity 
        activeOpacity={0.8}
        onLongPress={() => toggleMessageSelection(item.id)}
        onPress={() => {
          if (selectedMessages.length > 0) {
            toggleMessageSelection(item.id);
          }
        }}
        style={[
          styles.messageRow, 
          isUser ? styles.userRow : styles.opponentRow,
          isSelected && { backgroundColor: 'rgba(212, 255, 0, 0.15)' }
        ]}
      >
        {!isUser && (
          <Image source={{ uri: getAvatarUrl(currentOpponent.avatar) }} style={styles.chatAvatar} />
        )}
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.opponentBubble,
          isSelected && { borderColor: '#D4FF00', borderWidth: 1 }
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userText : styles.opponentText
          ]}>
            {item.text}
          </Text>
          <View style={styles.timestampContainer}>
            <Text style={[
              styles.timestampText,
              isUser ? styles.userTimestamp : styles.opponentTimestamp
            ]}>
              {item.timestamp}
            </Text>
            {isUser && (
              <Ionicons 
                name={item.status === 'sent' ? "checkmark" : "checkmark-done"} 
                size={14} 
                color={item.status === 'read' ? '#34B7F1' : '#8A95A5'} 
                style={styles.tickIcon}
              />
            )}
          </View>
        </View>
        {isUser && (
          <Image source={{ uri: getAvatarUrl(profile?.avatar) }} style={styles.chatAvatarRight} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient colors={['#0F1522', '#0A0F18']} style={styles.container}>
        
        {/* Header */}
        {selectedMessages.length > 0 ? (
          <View style={[styles.header, { backgroundColor: '#1C2433' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TouchableOpacity onPress={() => setSelectedMessages([])} style={styles.backBtn}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 10 }}>
                {selectedMessages.length}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerActionBtn}
                onPress={confirmDeleteMessages}
              >
                <Feather name="trash-2" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Feather name="arrow-left" size={24} color="#FFF" />
              </TouchableOpacity>
              
              <Image source={{ uri: getAvatarUrl(currentOpponent.avatar) }} style={styles.headerAvatar} />
              
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.headerName} numberOfLines={1}>{currentOpponent.name}</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: currentOpponent.is_online ? '#2ecc71' : '#8A95A5' }]} />
                  <Text style={styles.statusText}>{currentOpponent.is_online ? 'Online' : 'Offline'}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerActionBtn}
                onPress={() => navigation.navigate('CreateChallenge', { opponent: currentOpponent })}
              >
                <MaterialCommunityIcons name="sword-cross" size={20} color="#D4FF00" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerActionBtn}
                onPress={() => navigation.navigate('OpponentProfile', { opponent: currentOpponent })}
              >
                <Feather name="info" size={20} color="#8A95A5" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Message Thread */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
          />

          {isTyping && (
            <View style={styles.typingIndicatorRow}>
              <Image source={{ uri: getAvatarUrl(currentOpponent.avatar) }} style={styles.chatAvatarSmall} />
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color="#D4FF00" style={{ marginRight: 6 }} />
                <Text style={styles.typingText}>{currentOpponent.name} sedang mengetik...</Text>
              </View>
            </View>
          )}

          {/* Message Input */}
          <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TextInput
              style={styles.textInput}
              placeholder="Tulis pesan..."
              placeholderTextColor="#5C677D"
              value={inputText}
              onChangeText={setInputText}
              multiline={true}
              textAlignVertical="top"
            />
            
            <TouchableOpacity 
              style={[styles.sendBtn, inputText.trim() === '' && styles.sendBtnDisabled]} 
              onPress={handleSend}
              disabled={inputText.trim() === ''}
            >
              <Ionicons name="send" size={18} color="#0F1522" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F1522' },
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#1C2433',
    backgroundColor: '#0F1522' 
  },
  backBtn: { padding: 5, marginRight: 5 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#2D3748' },
  headerName: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2ecc71', marginRight: 5 },
  statusText: { fontSize: 11, color: '#8A95A5', fontWeight: '500' },
  
  headerActions: { flexDirection: 'row', gap: 15, alignItems: 'center' },
  headerActionBtn: { padding: 6 },

  chatContent: { padding: 15, paddingBottom: 25 },
  
  messageRow: { flexDirection: 'row', marginBottom: 15, width: '100%' },
  userRow: { justifyContent: 'flex-end' },
  opponentRow: { justifyContent: 'flex-start', alignItems: 'flex-end' },
  
  chatAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: '#2D3748' },
  chatAvatarRight: { width: 32, height: 32, borderRadius: 16, marginLeft: 8, borderWidth: 1, borderColor: '#2D3748' },
  chatAvatarSmall: { width: 24, height: 24, borderRadius: 12, marginRight: 8, marginLeft: 15, alignSelf: 'center' },
  
  messageBubble: { 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: 16, 
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1
  },
  userBubble: { 
    backgroundColor: '#D4FF00', 
    borderBottomRightRadius: 4 
  },
  opponentBubble: { 
    backgroundColor: '#161C26', 
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2D3748'
  },
  
  messageText: { fontSize: 14, lineHeight: 20 },
  userText: { color: '#0F1522', fontWeight: '500' },
  opponentText: { color: '#FFF' },
  
  timestampContainer: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 4 },
  timestampText: { fontSize: 9 },
  userTimestamp: { color: 'rgba(15, 21, 34, 0.6)' },
  opponentTimestamp: { color: '#5C677D' },
  tickIcon: { marginLeft: 4, marginBottom: -1 },

  typingIndicatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  typingBubble: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#161C26', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D3748'
  },
  typingText: { fontSize: 12, color: '#8A95A5' },

  inputBar: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    gap: 12
  },
  textInput: { 
    flex: 1, 
    backgroundColor: '#161C26', 
    color: '#FFF', 
    paddingHorizontal: 15, 
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#2D3748',
    fontSize: 14 
  },
  sendBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#D4FF00', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  sendBtnDisabled: { 
    backgroundColor: '#2D3748',
    opacity: 0.5 
  }
});
