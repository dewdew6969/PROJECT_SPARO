const fs = require('fs');

// Add to extraTranslations.js
let extra = fs.readFileSync('src/store/extraTranslations.js', 'utf8');
extra = extra.replace(/'中文 \(Chinese\)': \{/, "'中文 (Chinese)': {\n    confirm_complete_tournament_title: '完成锦标赛',\n    confirm_complete_tournament_msg: '您确定要确认完成锦标赛 “{title}” 吗？',\n    confirm_complete_tournament_yes: '确认',\n    confirm_complete_tournament_no: '取消',");
extra = extra.replace(/'Español': \{/, "'Español': {\n    confirm_complete_tournament_title: 'Completar Torneo',\n    confirm_complete_tournament_msg: '¿Está seguro de que desea confirmar la finalización del torneo \"{title}\"?',\n    confirm_complete_tournament_yes: 'CONFIRMAR',\n    confirm_complete_tournament_no: 'CANCELAR',");
extra = extra.replace(/'Français': \{/, "'Français': {\n    confirm_complete_tournament_title: 'Terminer le Tournoi',\n    confirm_complete_tournament_msg: 'Êtes-vous sûr de vouloir confirmer l\\'achèvement du tournoi \"{title}\"?',\n    confirm_complete_tournament_yes: 'CONFIRMER',\n    confirm_complete_tournament_no: 'ANNULER',");
fs.writeFileSync('src/store/extraTranslations.js', extra);

// Add to useAppStore.js
let appStore = fs.readFileSync('src/store/useAppStore.js', 'utf8');
appStore = appStore.replace(/'English \(US\)': \{/, "'English (US)': {\n    confirm_complete_tournament_title: 'Complete Tournament',\n    confirm_complete_tournament_msg: 'Are you sure you want to confirm the completion of tournament \"{title}\"?',\n    confirm_complete_tournament_yes: 'CONFIRM',\n    confirm_complete_tournament_no: 'CANCEL',");
appStore = appStore.replace(/'Bahasa Indonesia': \{/, "'Bahasa Indonesia': {\n    confirm_complete_tournament_title: 'Selesaikan Turnamen',\n    confirm_complete_tournament_msg: 'Apakah Anda ingin mengonfirmasi penyelesaian turnamen \"{title}\"?',\n    confirm_complete_tournament_yes: 'KONFIRMASI',\n    confirm_complete_tournament_no: 'BATAL',");
fs.writeFileSync('src/store/useAppStore.js', appStore);

console.log('Translations updated!');
