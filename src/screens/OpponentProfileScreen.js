import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// --- Mock Data ---
const MOCK_PROFILE = {
  name: 'Dews aja',
  username: '@dews_aja',
  location: 'Karawang, Indonesia',
  avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg', // Ganti dengan URL asli atau require()
  eloRating: 1000,
  skillLevel: 'BEGINNER',
  sports: [
    {
      id: 1,
      name: 'Basketball',
      type: 'Primary Sport',
      level: 'BEGINNER',
      icon: 'basketball' // MaterialCommunityIcons
    },
    {
      id: 2,
      name: 'Running',
      type: 'Secondary Sport',
      level: 'INTERMEDIATE',
      icon: 'run'
    }
  ],
  stats: {
    matchesPlayed: 0,
    winRate: 0,
    wins: 0,
    losses: 0
  },
  trust: {
    score: 100,
    sportsmanship: 5.0
  },
  availability: {
    days: 'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday',
    time: 'Any time'
  }
};

// --- Colors ---
const COLORS = {
  background: '#0F1522',
  cardBg: '#1A2130',
  cardBorder: '#273142',
  primary: '#D4FF00', // Neon Yellow
  secondaryText: '#8E9BB0', // Light Grey
  white: '#FFFFFF',
  blueAccent: '#8AA4FF', // Username & Skill Level color
  success: '#38A169',
  danger: '#E53E3E',
};

export default function OpponentProfileScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Custom Header (Opsional jika tidak pakai header bawaan React Navigation) */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Opponent Profile</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={COLORS.secondaryText} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* 1. Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: MOCK_PROFILE.avatarUrl }}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.name}>{MOCK_PROFILE.name}</Text>
          <Text style={styles.username}>{MOCK_PROFILE.username}</Text>

          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color={COLORS.secondaryText} />
            <Text style={styles.locationText}>{MOCK_PROFILE.location}</Text>
          </View>
        </View>

        {/* 2. Top Stats Row (ELO & Skill Level) */}
        <View style={styles.row}>
          <View style={[styles.statBox, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.statBoxValue, { color: COLORS.primary }]}>{MOCK_PROFILE.eloRating}</Text>
            <Text style={styles.statBoxLabel}>ELO RATING</Text>
          </View>
          <View style={[styles.statBox, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.statBoxValue, { color: COLORS.blueAccent }]}>{MOCK_PROFILE.skillLevel}</Text>
            <Text style={styles.statBoxLabel}>SKILL LEVEL</Text>
          </View>
        </View>

        {/* 3. Action Buttons */}
        <View style={styles.row}>
          <TouchableOpacity style={[styles.actionButton, styles.messageButton]}>
            <Ionicons name="chatbubble-outline" size={20} color={COLORS.white} style={styles.actionIcon} />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.challengeButton]}>
            <MaterialCommunityIcons name="sword-cross" size={20} color="#000" style={styles.actionIcon} />
            <Text style={styles.challengeButtonText}>Send Challenge</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Sports Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SPORTS CATEGORY</Text>
          <View style={styles.cardGroup}>
            {MOCK_PROFILE.sports.map((sport, index) => (
              <View
                key={sport.id}
                style={[
                  styles.sportRow,
                  index !== MOCK_PROFILE.sports.length - 1 && styles.borderBottom
                ]}
              >
                <View style={styles.sportIconWrapper}>
                  <MaterialCommunityIcons name={sport.icon} size={20} color={COLORS.primary} />
                </View>
                <View style={styles.sportInfo}>
                  <Text style={styles.sportName}>{sport.name}</Text>
                  <Text style={styles.sportLevel}>
                    {sport.type} • {sport.level}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 5. Match Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MATCH STATISTICS</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, styles.gridItem]}>
              <Text style={styles.statBoxValue}>{MOCK_PROFILE.stats.matchesPlayed}</Text>
              <Text style={styles.statBoxLabel}>Matches Played</Text>
            </View>
            <View style={[styles.statBox, styles.gridItem]}>
              <Text style={[styles.statBoxValue, { color: COLORS.primary }]}>{MOCK_PROFILE.stats.winRate}%</Text>
              <Text style={styles.statBoxLabel}>WIN RATE</Text>
            </View>
            <View style={[styles.statBox, styles.gridItem]}>
              <Text style={[styles.statBoxValue, { color: COLORS.success }]}>{MOCK_PROFILE.stats.wins}</Text>
              <Text style={styles.statBoxLabel}>WINS</Text>
            </View>
            <View style={[styles.statBox, styles.gridItem]}>
              <Text style={[styles.statBoxValue, { color: COLORS.danger }]}>{MOCK_PROFILE.stats.losses}</Text>
              <Text style={styles.statBoxLabel}>LOSSES</Text>
            </View>
          </View>
        </View>

        {/* 6. Trust & Reputation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TRUST & REPUTATION</Text>
          <View style={styles.cardGroup}>

            <View style={[styles.sportRow, styles.borderBottom]}>
              <View style={[styles.sportIconWrapper, { backgroundColor: 'transparent', width: 24, height: 24, marginRight: 12 }]}>
                <MaterialCommunityIcons name="shield-check-outline" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.sportInfo}>
                <Text style={styles.sportName}>Trust Score</Text>
                <Text style={styles.sportLevel}>Verified schedule compliance & completion.</Text>
              </View>
              <Text style={[styles.statBoxValue, { color: COLORS.primary, fontSize: 16 }]}>{MOCK_PROFILE.trust.score}%</Text>
            </View>

            <View style={styles.sportRow}>
              <View style={[styles.sportIconWrapper, { backgroundColor: 'transparent', width: 24, height: 24, marginRight: 12 }]}>
                <MaterialCommunityIcons name="star-outline" size={24} color={COLORS.blueAccent} />
              </View>
              <View style={styles.sportInfo}>
                <Text style={styles.sportName}>Sportsmanship</Text>
                <Text style={styles.sportLevel}>Average opponent rating.</Text>
              </View>
              {/* Diperbaiki menjadi 5.0 / 5.0 agar konsisten! */}
              <Text style={[styles.statBoxValue, { color: COLORS.blueAccent, fontSize: 16 }]}>{MOCK_PROFILE.trust.sportsmanship.toFixed(1)} / 5.0</Text>
            </View>

          </View>
        </View>

        {/* 7. Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AVAILABILITY</Text>
          <View style={styles.cardGroup}>

            <View style={[styles.sportRow, { alignItems: 'flex-start' }]}>
              <View style={[styles.sportIconWrapper, { backgroundColor: 'transparent', width: 24, height: 24, marginRight: 12, marginTop: 2 }]}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={20} color={COLORS.secondaryText} />
              </View>
              <View style={styles.sportInfo}>
                <Text style={styles.sportLevel}>Days</Text>
                <Text style={[styles.sportName, { marginTop: 4, lineHeight: 22 }]}>{MOCK_PROFILE.availability.days}</Text>
              </View>
            </View>

            <View style={[styles.sportRow, { alignItems: 'flex-start' }]}>
              <View style={[styles.sportIconWrapper, { backgroundColor: 'transparent', width: 24, height: 24, marginRight: 12, marginTop: 2 }]}>
                <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.secondaryText} />
              </View>
              <View style={styles.sportInfo}>
                <Text style={styles.sportLevel}>Time</Text>
                <Text style={[styles.sportName, { marginTop: 4 }]}>{MOCK_PROFILE.availability.time}</Text>
              </View>
            </View>

          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  menuButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Profile Section
  profileSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarContainer: {
    padding: 4,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: COLORS.primary, // Neon Yellow Border
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    color: COLORS.blueAccent,
    fontWeight: '500',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: COLORS.secondaryText,
    marginLeft: 4,
  },

  // Generic Row & Box
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statBox: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  statBoxLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Action Buttons
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 8,
  },
  messageButton: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginRight: 8,
  },
  messageButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  challengeButton: {
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  challengeButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: 'bold',
  },

  // Sections
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.secondaryText,
    marginBottom: 12,
    letterSpacing: 1,
  },
  cardGroup: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  sportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  sportIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 255, 0, 0.1)', // Transparan neon yellow
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sportInfo: {
    flex: 1,
  },
  sportName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  sportLevel: {
    fontSize: 12,
    color: COLORS.secondaryText,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%', // Supaya bisa 2 kolom
    marginBottom: 12,
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});
