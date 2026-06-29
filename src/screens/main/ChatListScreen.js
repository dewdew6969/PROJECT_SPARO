import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import useAppStore from '../../store/useAppStore';
import { useIsFocused } from '@react-navigation/native';
import { Image } from 'expo-image';

export default function ChatListScreen({ navigation }) {
  const { profile } = useAppStore();
  const [chatList, setChatList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChats, setSelectedChats] = useState([]);
  const isFocused = useIsFocused();

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

  const fetchChats = async () => {
    if (!profile) return;
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      const response = await fetch(`${apiUrl}/chats/${profile?.id}?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        setChatList(data);
      }
    } catch (error) {
      console.error("Failed to fetch chat list", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let pollInterval;
    if (isFocused) {
      fetchChats();
      
      // Fallback polling to keep chat list real-time (1 detik)
      pollInterval = setInterval(() => {
        fetchChats();
      }, 1000);
    }
    
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isFocused]);

  // --- Logic Hapus Seluruh Chat ---
  const toggleChatSelection = (opponentId) => {
    setSelectedChats(prev => {
      if (prev.includes(opponentId)) {
        return prev.filter(id => id !== opponentId);
      } else {
        return [...prev, opponentId];
      }
    });
  };

  const deleteSelectedChats = async () => {
    if (selectedChats.length === 0) return;
    
    // Hapus dari UI sementara
    const prevList = [...chatList];
    setChatList(list => list.filter(c => !selectedChats.includes(c.opponent.id)));
    
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      // Hapus satu persatu berdasarkan opponent_id
      for (const opponentId of selectedChats) {
        await fetch(`${apiUrl}/chats/${profile?.id}/${opponentId}`, {
          method: 'DELETE' });
      }
      setSelectedChats([]);
    } catch (err) {
      console.error("Delete Chat Error:", err);
      setChatList(prevList);
      Alert.alert("Error", "Gagal menghapus obrolan, silakan coba lagi.");
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Hapus Obrolan",
      `Apakah Anda yakin ingin menghapus seluruh pesan dengan ${selectedChats.length} pengguna ini?`,
      [
        { text: "Batal", style: "cancel" },
        { text: "Hapus", style: "destructive", onPress: deleteSelectedChats }
      ]
    );
  };
  // -----------------------------

  const renderItem = ({ item }) => {
    const { opponent, last_message, unread_count } = item;
    const isSelected = selectedChats.includes(opponent.id);
    
    return (
      <TouchableOpacity 
        style={[
          styles.chatRow,
          isSelected && { backgroundColor: 'rgba(212, 255, 0, 0.15)' }
        ]}
        onLongPress={() => toggleChatSelection(opponent.id)}
        onPress={() => {
          if (selectedChats.length > 0) {
            toggleChatSelection(opponent.id);
          } else {
            useAppStore.getState().setSelectedOpponent(opponent);
            navigation.navigate('Chat', { opponent });
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image source={{ uri: getAvatarUrl(opponent.avatar) }} style={styles.avatar} />
          {opponent.is_online && <View style={styles.onlineBadge} />}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText} numberOfLines={1}>{opponent.name}</Text>
            <Text style={[styles.timeText, unread_count > 0 && styles.unreadTime]}>
              {formatDate(last_message.timestamp)}
            </Text>
          </View>
          
          <View style={styles.messageRow}>
            {last_message.is_mine && (
              <Ionicons 
                name={last_message.status === 'sent' ? "checkmark" : "checkmark-done"} 
                size={16} 
                color={last_message.status === 'read' ? '#34B7F1' : '#8A95A5'} 
                style={styles.tickIcon}
              />
            )}
            <Text style={[styles.messageText, unread_count > 0 && styles.unreadMessageText]} numberOfLines={1}>
              {last_message.text}
            </Text>
            
            {unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient colors={['#0F1522', '#0A0F18']} style={styles.container}>
        {/* Header */}
        {selectedChats.length > 0 ? (
          <View style={[styles.header, { backgroundColor: '#1C2433' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TouchableOpacity onPress={() => setSelectedChats([])} style={styles.backBtn}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 10 }}>
                {selectedChats.length}
              </Text>
            </View>
            <TouchableOpacity onPress={confirmDelete} style={{ padding: 5 }}>
              <Feather name="trash-2" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Feather name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Obrolan</Text>
          </View>
        )}

        {/* Content */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#D4FF00" />
          </View>
        ) : chatList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="message-circle" size={60} color="#1C2433" style={{ marginBottom: 20 }} />
            <Text style={styles.emptyTitle}>Belum ada obrolan</Text>
            <Text style={styles.emptyDesc}>Mulai interaksi dengan pemain lain dan atur jadwal pertandingan sekarang.</Text>
            <TouchableOpacity 
              style={styles.btnFind}
              onPress={() => {
                navigation.goBack();
                navigation.navigate('Opponent');
              }}
            >
              <Text style={styles.btnFindText}>Cari Lawan Tanding</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={chatList}
            renderItem={renderItem}
            keyExtractor={(item) => item.opponent.id}
            contentContainerStyle={styles.listContent}
          />
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F1522' },
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1C2433'
  },
  backBtn: { padding: 5, marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 10 },
  emptyDesc: { fontSize: 14, color: '#8A95A5', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  btnFind: { backgroundColor: '#D4FF00', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
  btnFindText: { color: '#0F1522', fontWeight: 'bold', fontSize: 14 },

  listContent: { paddingVertical: 10 },
  chatRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#161C26'
  },
  avatarContainer: { position: 'relative' },
  avatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: '#2D3748' },
  onlineBadge: { 
    position: 'absolute', 
    bottom: 2, 
    right: 2, 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    backgroundColor: '#2ecc71',
    borderWidth: 2,
    borderColor: '#0F1522'
  },
  
  chatInfo: { flex: 1, marginLeft: 15 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  nameText: { fontSize: 16, fontWeight: 'bold', color: '#FFF', flex: 1, marginRight: 10 },
  timeText: { fontSize: 12, color: '#8A95A5' },
  unreadTime: { color: '#D4FF00', fontWeight: 'bold' },
  
  messageRow: { flexDirection: 'row', alignItems: 'center' },
  tickIcon: { marginRight: 4 },
  messageText: { fontSize: 14, color: '#8A95A5', flex: 1 },
  unreadMessageText: { color: '#FFF', fontWeight: '500' },
  
  unreadBadge: { 
    backgroundColor: '#D4FF00', 
    borderRadius: 10, 
    minWidth: 20, 
    height: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6
  },
  unreadCount: { color: '#0F1522', fontSize: 11, fontWeight: 'bold' }
});
