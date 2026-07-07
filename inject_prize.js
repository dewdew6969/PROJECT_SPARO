const fs = require('fs');
let file = fs.readFileSync('src/screens/main/CreateTournamentScreen.js', 'utf8');

if (!file.includes('const [prize, setPrize] = useState')) {
  file = file.replace("const [maxParticipants, setMaxParticipants] = useState('16');", "const [maxParticipants, setMaxParticipants] = useState('16');\n  const [prize, setPrize] = useState('');");
}

if (!file.includes('prize: prize')) {
  file = file.replace("max_participants: parseInt(maxParticipants, 10) || 0", "max_participants: parseInt(maxParticipants, 10) || 0,\n          prize: prize || 'Trophy & Cash'");
}

const prizeUI = `
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{(t('prize_label') || 'PRIZE (OPTIONAL)').toUpperCase()}</Text>
            <View style={styles.inputBox}>
              <Feather name="gift" size={20} color="#8A95A5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('prize_placeholder') || "e.g. Trophy & Cash"}
                placeholderTextColor="#8A95A5"
                value={prize}
                onChangeText={setPrize}
              />
            </View>
          </View>
`;

if (!file.includes('prize_placeholder')) {
  // Find </ScrollView> that comes right after <View style={{ height: 100 }} />
  file = file.replace("          <View style={{ height: 100 }} />\n        </ScrollView>", prizeUI + "\n          <View style={{ height: 100 }} />\n        </ScrollView>");
}

fs.writeFileSync('src/screens/main/CreateTournamentScreen.js', file);
console.log('Prize field injected successfully!');
