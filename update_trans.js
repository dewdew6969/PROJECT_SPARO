const fs = require('fs');

// Add to extraTranslations.js
let extra = fs.readFileSync('src/store/extraTranslations.js', 'utf8');
extra = extra.replace(/'中文 \(Chinese\)': \{/, "'中文 (Chinese)': {\n    tournament_completed_success: '锦标赛已完成',\n    tournament_completed_msg: '锦标赛 \"{title}\" 已成功完成并从仪表板隐藏。',");
extra = extra.replace(/'Español': \{/, "'Español': {\n    tournament_completed_success: 'Torneo Completado',\n    tournament_completed_msg: 'El torneo \"{title}\" se ha completado con éxito y se ha ocultado del tablero.',");
extra = extra.replace(/'Français': \{/, "'Français': {\n    tournament_completed_success: 'Tournoi Terminé',\n    tournament_completed_msg: 'Le tournoi \"{title}\" a été terminé avec succès et masqué du tableau de bord.',");
fs.writeFileSync('src/store/extraTranslations.js', extra);

// Add to useAppStore.js
let appStore = fs.readFileSync('src/store/useAppStore.js', 'utf8');
appStore = appStore.replace(/'English \(US\)': \{/, "'English (US)': {\n    tournament_completed_success: 'Tournament Completed',\n    tournament_completed_msg: 'Tournament \"{title}\" has been successfully completed and hidden from the dashboard.',");
appStore = appStore.replace(/'Bahasa Indonesia': \{/, "'Bahasa Indonesia': {\n    tournament_completed_success: 'Turnamen Selesai',\n    tournament_completed_msg: 'Turnamen \"{title}\" telah diselesaikan dan disembunyikan dari beranda.',");
fs.writeFileSync('src/store/useAppStore.js', appStore);

console.log('Translations updated!');
