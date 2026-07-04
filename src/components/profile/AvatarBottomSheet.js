import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function AvatarBottomSheet({ visible, onClose, onUpdateAvatar, t, setAlertConfig, setZoomModalVisible }) {
  
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      onUpdateAvatar(result.assets[0].uri);
      onClose();
    }
  };

  const handleCamera = async () => {
    let { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setAlertConfig({ visible: true, title: t('permission_denied') === 'permission_denied' ? 'Izin Ditolak' : t('permission_denied'), message: t('camera_permission_required') === 'camera_permission_required' ? 'Izin kamera dibutuhkan' : t('camera_permission_required') });
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      onUpdateAvatar(result.assets[0].uri);
      onClose();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.bottomSheetOverlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <TouchableOpacity activeOpacity={1} style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>{t('profile_photo') === 'profile_photo' ? 'Foto Profil' : t('profile_photo')}</Text>
            <TouchableOpacity onPress={() => {
              onUpdateAvatar('https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png');
              onClose();
              if (setZoomModalVisible) setZoomModalVisible(false);
            }}>
              <Feather name="trash-2" size={22} color="#FF6B6B" />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSheetOptions}>
            <TouchableOpacity style={styles.bottomSheetOptionItem} onPress={handleCamera}>
              <View style={styles.bottomSheetIconWrapper}>
                <Feather name="camera" size={24} color="#FFF" />
              </View>
              <Text style={styles.bottomSheetOptionText}>{t('camera') === 'camera' ? 'Kamera' : t('camera')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bottomSheetOptionItem} onPress={pickImage}>
              <View style={styles.bottomSheetIconWrapper}>
                <Feather name="image" size={24} color="#FFF" />
              </View>
              <Text style={styles.bottomSheetOptionText}>{t('gallery') === 'gallery' ? 'Galeri' : t('gallery')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheetContent: { backgroundColor: '#1C2433', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25, paddingBottom: Platform.OS === 'ios' ? 40 : 25 },
  bottomSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  bottomSheetTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  bottomSheetOptions: { flexDirection: 'row', justifyContent: 'flex-start', gap: 30 },
  bottomSheetOptionItem: { alignItems: 'center' },
  bottomSheetIconWrapper: { width: 55, height: 55, borderRadius: 27.5, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#2D3748', backgroundColor: '#161C26' },
  bottomSheetOptionText: { color: '#8A95A5', fontSize: 12, fontWeight: '600' }
});
