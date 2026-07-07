import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// --- Colors Theme (Sparo Identity) ---
const COLORS = {
  background: '#0F1522', // Dark navy background
  cardBg: '#1A2130',     // Darker card background
  cardBorder: '#273142', // Card border line
  primary: '#D4FF00',    // Neon Yellow
  secondaryText: '#8E9BB0', // Light Grey
  white: '#FFFFFF',
  blueAccent: '#8AA4FF',
  danger: '#FF6B6B',     // Soft Red for Opponent
  stepperBg: '#2A3445',  // Minus button background
};

export default function MatchVerificationScreen({ navigation }) {
  // State Management
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  // Handlers
  const incrementScore = (setter, current) => setter(current + 1);
  const decrementScore = (setter, current) => {
    if (current > 0) setter(current - 1);
  };

  const handleVerify = () => {
    // Simulasi loading atau API call bisa ditaruh di sini
    setIsSuccess(true);
  };

  const handleReset = () => {
    // Kembali ke keadaan awal atau navigasi ke Home
    setIsSuccess(false);
    setMyScore(0);
    setOpponentScore(0);
    // navigation?.navigate('Home'); // Uncomment untuk navigasi betulan
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* --- Header --- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={26} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verifikasi Hasil</Text>
        <View style={{ width: 34 }} />
      </View>

      <View style={styles.mainContainer}>
        {!isSuccess ? (
          <View style={styles.content}>
            {/* --- INPUT SCORE VIEW --- */}
            
            {/* Match Header Info */}
            <View style={styles.matchInfoContainer}>
              <View style={styles.matchIconBadge}>
                <MaterialCommunityIcons name="soccer" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.matchTitle}>Futsal Match</Text>
              <Text style={styles.matchVenue}>GOR Karawang, Indonesia</Text>
              <Text style={styles.matchDate}>Minggu, 12 Agustus 2026 • 19:00 WIB</Text>
            </View>

            <Text style={styles.instructionText}>Masukan skor akhir pertandingan</Text>

            {/* Score Input Cards */}
            <View style={styles.scoreBoardRow}>
              
              {/* Card My Team */}
              <View style={styles.scoreCard}>
                <Text style={styles.teamName}>My Team</Text>
                <Text style={styles.scoreText}>{myScore}</Text>
                
                <View style={styles.stepperContainer}>
                  <TouchableOpacity 
                    style={styles.stepperButton} 
                    onPress={() => decrementScore(setMyScore, myScore)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="minus" size={32} color={COLORS.white} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.stepperButton, { backgroundColor: COLORS.blueAccent }]} 
                    onPress={() => incrementScore(setMyScore, myScore)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="plus" size={32} color={COLORS.background} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* VS Divider */}
              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>VS</Text>
              </View>

              {/* Card Opponent */}
              <View style={styles.scoreCard}>
                <Text style={styles.teamName}>Opponent</Text>
                <Text style={[styles.scoreText, { color: COLORS.danger }]}>{opponentScore}</Text>
                
                <View style={styles.stepperContainer}>
                  <TouchableOpacity 
                    style={styles.stepperButton} 
                    onPress={() => decrementScore(setOpponentScore, opponentScore)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="minus" size={32} color={COLORS.white} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.stepperButton, { backgroundColor: COLORS.danger }]} 
                    onPress={() => incrementScore(setOpponentScore, opponentScore)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="plus" size={32} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          </View>
        ) : (
          <View style={styles.successContainer}>
            {/* --- SUCCESS VIEW --- */}
            <View style={styles.trophyGlow}>
              <Ionicons name="trophy" size={120} color={COLORS.primary} />
            </View>
            <Text style={styles.successTitle}>Verifikasi Berhasil!</Text>
            <Text style={styles.successSubtitle}>Hasil pertandingan telah disimpan secara resmi.</Text>
            
            {/* Rank Card */}
            <View style={styles.rankCard}>
              <View style={styles.rankIconBox}>
                <MaterialCommunityIcons name="arrow-up-bold" size={28} color={COLORS.background} />
              </View>
              <View style={styles.rankTextContainer}>
                <Text style={styles.rankSubtext}>Pencapaian Baru</Text>
                <Text style={styles.rankText}>Rank Naik ke Peringkat #12 di Leaderboard!</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* --- Sticky Action Bar --- */}
      <View style={styles.bottomBar}>
        {!isSuccess ? (
          <TouchableOpacity style={styles.primaryButton} onPress={handleVerify} activeOpacity={0.8}>
            <MaterialCommunityIcons name="check-decagram" size={24} color="#000" style={styles.btnIcon} />
            <Text style={styles.primaryButtonText}>Verifikasi & Selesai</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleReset} activeOpacity={0.8}>
            <Ionicons name="home-outline" size={22} color={COLORS.white} style={styles.btnIcon} />
            <Text style={styles.secondaryButtonText}>Kembali ke Beranda</Text>
          </TouchableOpacity>
        )}
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mainContainer: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  // Match Info
  matchInfoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  matchIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 255, 0, 0.1)', // Transparan neon yellow
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  matchTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  matchVenue: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 6,
  },
  matchDate: {
    fontSize: 13,
    color: COLORS.secondaryText,
  },

  instructionText: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.secondaryText,
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 'bold',
  },

  // Score Board
  scoreBoardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondaryText,
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 72,
    fontWeight: '900',
    color: COLORS.white,
    lineHeight: 80,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
    paddingHorizontal: 10,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.stepperBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  vsContainer: {
    paddingHorizontal: 12,
  },
  vsText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.secondaryText,
    fontStyle: 'italic',
  },

  // Success View
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  trophyGlow: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(212, 255, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'rgba(212, 255, 0, 0.2)',
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    color: COLORS.secondaryText,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 164, 255, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.blueAccent,
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  rankIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.blueAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rankTextContainer: {
    flex: 1,
  },
  rankSubtext: {
    fontSize: 12,
    color: COLORS.blueAccent,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  rankText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: 'bold',
    lineHeight: 22,
  },

  // Sticky Bottom Bar
  bottomBar: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  btnIcon: {
    marginRight: 8,
  },
});
