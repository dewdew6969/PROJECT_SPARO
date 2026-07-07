const fs = require('fs');
let file = fs.readFileSync('src/screens/main/CreateTournamentScreen.js', 'utf8');

// 1. Add ImagePicker import
if (!file.includes("import * as ImagePicker")) {
  file = file.replace(
    "import { Feather } from '@expo/vector-icons';",
    "import { Feather } from '@expo/vector-icons';\nimport * as ImagePicker from 'expo-image-picker';\nimport { Image } from 'expo-image';"
  );
}

// 2. Add poster state and function
if (!file.includes("const [poster, setPoster]")) {
  const stateInjection = `
  const [maxParticipants, setMaxParticipants] = useState('16');
  const [prize, setPrize] = useState('');
  const [poster, setPoster] = useState(null);

  const pickPoster = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPoster(result.assets[0].uri);
    }
  };`;
  file = file.replace(/const \[maxParticipants, setMaxParticipants\] = useState\('16'\);\s*const \[prize, setPrize\] = useState\(''\);/, stateInjection);
}

// 3. Add UI for Poster and Prize
const uiInjection = `
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>POSTER IMAGE (OPTIONAL)</Text>
            <TouchableOpacity style={styles.posterUpload} onPress={pickPoster}>
              {poster ? (
                <Image source={{ uri: poster }} style={styles.posterImage} contentFit="cover" />
              ) : (
                <>
                  <Feather name="image" size={24} color="#8A95A5" />
                  <Text style={styles.posterText}>Tap to upload poster</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{(t('prize_label') || 'PRIZE (OPTIONAL)').toUpperCase()}</Text>
            <View style={styles.inputBox}>
              <Feather name="gift" size={20} color="#8A95A5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('prize_placeholder') || "e.g. Gold Medal"}
                placeholderTextColor="#8A95A5"
                value={prize}
                onChangeText={setPrize}
              />
            </View>
          </View>
`;

if (!file.includes("POSTER IMAGE")) {
  file = file.replace(
    /<\/View>\s*<View style=\{\{ height: 100 \}\} \/>\s*<\/ScrollView>/,
    `</View>\n\n${uiInjection}\n\n          <View style={{ height: 100 }} />\n        </ScrollView>`
  );
}

// 4. Update handleCreate to upload poster after tournament creation
if (!file.includes("/upload-poster")) {
  const handleCreateNew = `
      const response = await fetch(\`\${API_URL}/tournaments/\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          sport: sport,
          date: date.toISOString(),
          location: activeVenue.name,
          max_participants: parseInt(maxParticipants, 10) || 0,
          prize: prize || 'Trophy & Cash'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Upload poster if exists
        if (poster) {
          try {
            let formData = new FormData();
            formData.append('file', {
              uri: poster,
              name: 'poster.jpg',
              type: 'image/jpeg',
            });
            await fetch(\`\${API_URL}/tournaments/\${result.id}/upload-poster\`, {
              method: 'POST',
              body: formData,
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
          } catch (uploadError) {
            console.error('Failed to upload poster:', uploadError);
          }
        }

        if (Platform.OS === 'android') {
          import('react-native').then(({ ToastAndroid }) => ToastAndroid.show('Tournament Created!', ToastAndroid.SHORT));
        }
        navigation.goBack(); // Return to dashboard
      } else {
`;
  file = file.replace(
    /const response = await fetch\(`\$\{API_URL\}\/tournaments\/`[\s\S]*?navigation\.goBack\(\);\s*\/\/ Return to dashboard\s*\} else \{/m,
    handleCreateNew.trim()
  );
}

// 5. Add styles for poster
if (!file.includes("posterUpload:")) {
  file = file.replace(
    "scrollContent: { padding: 20 },",
    "scrollContent: { padding: 20 },\n  posterUpload: { height: 150, backgroundColor: '#1C2433', borderRadius: 12, borderWidth: 1, borderColor: '#2D3748', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },\n  posterImage: { width: '100%', height: '100%', borderRadius: 12 },\n  posterText: { color: '#8A95A5', marginTop: 10, fontSize: 12 },"
  );
}

fs.writeFileSync('src/screens/main/CreateTournamentScreen.js', file);
console.log('Successfully added poster and prize to CreateTournamentScreen.js!');
