import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Modal, Platform } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import useAppStore from '../../store/useAppStore';
import CustomAlert from '../../components/CustomAlert';

export default function MatchVerificationScreen({ route, navigation }) {
    const { t, language } = useAppStore();
    const { challenge, userId } = route?.params || {};
    const insets = useSafeAreaInsets();

    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Status Flow
    const [checkedIn, setCheckedIn] = useState(false);
    const [myScore, setMyScore] = useState('');
    const [opponentScore, setOpponentScore] = useState('');
    const [isConflict, setIsConflict] = useState(false);
    const [proofImage, setProofImage] = useState(null);
    const [imagePickerModalVisible, setImagePickerModalVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', onCloseAction: null });

    const showAlert = (title, message, onCloseAction = null) => {
        setAlertConfig({ visible: true, title, message, onCloseAction });
    };

    const handleCloseAlert = () => {
        const action = alertConfig.onCloseAction;
        setAlertConfig({ ...alertConfig, visible: false, onCloseAction: null });
        if (action) action();
    };

    const handleCheckIn = async () => {
        setLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showAlert("Akses Ditolak", "Izin akses lokasi dibutuhkan untuk fitur check-in.");
                setLoading(false);
                return;
            }

            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);
            
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
            const response = await fetch(`${API_URL}/challenges/${challenge?.id || 1}/checkin?user_id=${userId || 1}&lat=${loc.coords.latitude}&lon=${loc.coords.longitude}`, {
                method: 'POST'
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Gagal melakukan check-in");
            }
            
            setCheckedIn(true);
            showAlert("Check-in Berhasil!", "Sistem memvalidasi bahwa Anda berada di venue pertandingan.");
        } catch (error) {
            showAlert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitScore = async () => {
        if (!myScore || !opponentScore) {
            showAlert("Perhatian", "Mohon masukkan skor pertandingan.");
            return;
        }
        try {
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
            const response = await fetch(`${API_URL}/challenges/${challenge?.id || 1}/submit-score?user_id=${userId || 1}&my_score=${myScore}&opponent_score=${opponentScore}`, {
                method: 'POST'
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Gagal mengirim skor");
            }
            showAlert("Sukses", "Skor berhasil dikirim. Menunggu konfirmasi dari lawan...");
        } catch (error) {
            showAlert("Error", error.message);
        }
    };

    const handleConfirmScore = async (agreed) => {
        try {
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
            const response = await fetch(`${API_URL}/challenges/${challenge?.id || 1}/confirm-score?user_id=${userId || 1}&is_agreed=${agreed}`, {
                method: 'POST'
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Gagal mengkonfirmasi skor");
            }

            if (agreed) {
                showAlert("Match Selesai", "Pertandingan telah terverifikasi. ELO Rating Anda akan diperbarui oleh sistem.", () => navigation.goBack());
            } else {
                setIsConflict(true);
            }
        } catch (error) {
            Alert.alert("Error", error.message);
        }
    };

    const handlePickImage = () => {
        setImagePickerModalVisible(true);
    };

    const uploadImageToBackend = async (uri) => {
        try {
            setLoading(true);
            showAlert("Proses OCR AI", "Mengunggah foto dan memproses AI OCR di server...");
            
            const formData = new FormData();
            const filename = uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;
            formData.append('file', { uri, name: filename, type });
            
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
            const response = await fetch(`${API_URL}/challenges/${challenge?.id || 1}/upload-proof`, {
                method: 'POST',
                body: formData,
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Gagal mengunggah bukti skor");
            }
            
            setProofImage(uri);
            
            // Format respons dari server untuk ditampilkan ke user
            let resultMsg = "Foto bukti berhasil diunggah dan diproses oleh server.";
            if (data.ocr_result || data.extracted_score) {
                resultMsg += `\n\nHasil Deteksi AI:\n${JSON.stringify(data.ocr_result || data.extracted_score, null, 2)}`;
            } else if (data.message) {
                resultMsg += `\n\nPesan Server: ${data.message}`;
            } else if (Object.keys(data).length > 0) {
                resultMsg += `\n\nData Mentah Server:\n${JSON.stringify(data, null, 2)}`;
            }

            showAlert("Sukses", resultMsg);
        } catch (error) {
            showAlert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="chevron-left" size={32} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('match_verification')}</Text>
            </View>

            <View style={styles.content}>
                {!checkedIn ? (
                    <View style={styles.card}>
                        <MaterialCommunityIcons name="map-marker-radius" size={64} color="#D4FF00" style={styles.iconCenter} />
                        <Text style={styles.title}>{t('gps_checkin')}</Text>
                        <Text style={styles.desc}>{t('gps_checkin_desc')}</Text>
                        <TouchableOpacity style={styles.primaryBtn} onPress={handleCheckIn} disabled={loading}>
                            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>{t('checkin_now')}</Text>}
                        </TouchableOpacity>
                    </View>
                ) : !isConflict ? (
                    <View style={styles.card}>
                        <MaterialCommunityIcons name="scoreboard" size={64} color="#D4FF00" style={styles.iconCenter} />
                        <Text style={styles.title}>{t('input_final_score')}</Text>
                        
                        <View style={styles.scoreRow}>
                            <View style={styles.scoreInputContainer}>
                                <Text style={styles.scoreLabel}>{t('my_score')}</Text>
                                <TextInput style={styles.scoreInput} keyboardType="numeric" value={myScore} onChangeText={setMyScore} maxLength={3} />
                            </View>
                            <Text style={styles.vsText}>VS</Text>
                            <View style={styles.scoreInputContainer}>
                                <Text style={styles.scoreLabel}>{t('opponent_score')}</Text>
                                <TextInput style={styles.scoreInput} keyboardType="numeric" value={opponentScore} onChangeText={setOpponentScore} maxLength={3} />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmitScore}>
                            <Text style={styles.primaryBtnText}>{t('submit_score_btn')}</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />
                        
                        {/* Simulasi UI untuk Lawan Mengkonfirmasi */}
                        <Text style={styles.subtitle}>{t('opponent_confirmation')}</Text>
                        <Text style={styles.desc}>{t('opponent_confirmation_desc')}</Text>
                        
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.actionBtn, styles.agreeBtn]} onPress={() => handleConfirmScore(true)}>
                                <Text style={styles.actionBtnText}>{t('agree')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, styles.disagreeBtn]} onPress={() => handleConfirmScore(false)}>
                                <Text style={styles.actionBtnText}>{t('disagree')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.card}>
                        <MaterialCommunityIcons name="alert-decagram" size={64} color="#FF4D4D" style={styles.iconCenter} />
                        <Text style={styles.title}>{t('conflict_detected')}</Text>
                        <Text style={styles.desc}>{t('conflict_desc')}</Text>
                        
                        {proofImage && <Image source={{uri: proofImage}} style={styles.proofImage} />}

                        <TouchableOpacity style={styles.primaryBtn} onPress={handlePickImage}>
                            <Text style={styles.primaryBtnText}>{proofImage ? t('change_photo') : t('upload_proof')}</Text>
                        </TouchableOpacity>
                        <Text style={styles.infoText}>{t('ocr_info')}</Text>
                    </View>
                )}
            </View>

            {/* Custom Image Picker Modal */}
            <Modal visible={imagePickerModalVisible} transparent={true} animationType="fade" onRequestClose={() => setImagePickerModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setImagePickerModalVisible(false)}>
                    <View style={[styles.actionSheet, { paddingBottom: Math.max(insets.bottom + 20, 30) }]}>
                        <View style={styles.actionSheetHeader}>
                            <Text style={styles.actionSheetTitle}>Unggah Foto Bukti Skor</Text>
                        </View>
                        <TouchableOpacity style={styles.actionSheetItem} onPress={async () => {
                            setImagePickerModalVisible(false);
                            const { status } = await ImagePicker.requestCameraPermissionsAsync();
                            if (status !== 'granted') {
                                showAlert('Izin Ditolak', 'Izin kamera dibutuhkan untuk mengambil foto skor.');
                                return;
                            }
                            let result = await ImagePicker.launchCameraAsync({
                                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                allowsEditing: true,
                                quality: 0.8,
                            });
                            if (!result.canceled) {
                                uploadImageToBackend(result.assets[0].uri);
                            }
                        }}>
                            <MaterialCommunityIcons name="camera" size={24} color="#FFF" style={{ marginRight: 15 }} />
                            <Text style={styles.actionSheetText}>Kamera</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.actionSheetItem} onPress={async () => {
                            setImagePickerModalVisible(false);
                            let result = await ImagePicker.launchImageLibraryAsync({
                                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                allowsEditing: true,
                                quality: 0.8,
                            });
                            if (!result.canceled) {
                                uploadImageToBackend(result.assets[0].uri);
                            }
                        }}>
                            <MaterialCommunityIcons name="image" size={24} color="#FFF" style={{ marginRight: 15 }} />
                            <Text style={styles.actionSheetText}>Galeri</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <CustomAlert 
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={handleCloseAlert}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
    backBtn: { padding: 4 },
    content: { flex: 1, padding: 20, justifyContent: 'center' },
    card: { backgroundColor: '#1A1A1A', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#333' },
    iconCenter: { alignSelf: 'center', marginBottom: 16 },
    title: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
    desc: { color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    primaryBtn: { backgroundColor: '#D4FF00', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    primaryBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
    scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    scoreInputContainer: { flex: 1, alignItems: 'center' },
    scoreLabel: { color: '#aaa', marginBottom: 8 },
    scoreInput: { backgroundColor: '#000', color: '#fff', fontSize: 32, fontWeight: 'bold', width: 80, height: 80, borderRadius: 16, textAlign: 'center', borderWidth: 1, borderColor: '#333' },
    vsText: { color: '#D4FF00', fontSize: 20, fontWeight: 'bold', marginHorizontal: 16 },
    divider: { height: 1, backgroundColor: '#333', marginVertical: 24 },
    subtitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    actionBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', marginHorizontal: 8 },
    agreeBtn: { backgroundColor: '#28a745' },
    disagreeBtn: { backgroundColor: '#dc3545' },
    actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    proofImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 20 },
    infoText: { color: '#666', fontSize: 12, textAlign: 'center', marginTop: 16 },
    
    // Action Sheet for Image Picker
    modalOverlay: { flex: 1, backgroundColor: 'rgba(10,15,24,0.7)', justifyContent: 'flex-end' },
    actionSheet: { backgroundColor: '#1C2433', width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    actionSheetHeader: { marginBottom: 20, alignItems: 'center' },
    actionSheetTitle: { fontSize: 16, fontWeight: 'bold', color: '#8A95A5' },
    actionSheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#2D3748' },
    actionSheetText: { fontSize: 16, color: '#FFF' }
});
