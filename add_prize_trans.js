const fs = require('fs');

// Add to extraTranslations.js
let extra = fs.readFileSync('src/store/extraTranslations.js', 'utf8');
extra = extra.replace(/'中文 \(Chinese\)': \{/, "'中文 (Chinese)': {\n    prize_placeholder: '输入奖品 (例如：金牌)',\n    prize_label: '奖品 (可选)',");
extra = extra.replace(/'Español': \{/, "'Español': {\n    prize_placeholder: 'Ingrese el premio (ej: Medalla de Oro)',\n    prize_label: 'Premio (Opcional)',");
extra = extra.replace(/'Français': \{/, "'Français': {\n    prize_placeholder: 'Entrer le prix (ex: Médaille d\\'or)',\n    prize_label: 'Prix (Optionnel)',");
fs.writeFileSync('src/store/extraTranslations.js', extra);

// Add to useAppStore.js
let appStore = fs.readFileSync('src/store/useAppStore.js', 'utf8');
appStore = appStore.replace(/'English \(US\)': \{/, "'English (US)': {\n    prize_placeholder: 'Enter prize (e.g., Gold Medal)',\n    prize_label: 'Prize (Optional)',");
appStore = appStore.replace(/'Bahasa Indonesia': \{/, "'Bahasa Indonesia': {\n    prize_placeholder: 'Masukkan hadiah (contoh: Medali Emas)',\n    prize_label: 'Hadiah (Opsional)',");
fs.writeFileSync('src/store/useAppStore.js', appStore);

console.log('Prize translations updated!');
