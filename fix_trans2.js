const fs = require('fs');

// Update extraTranslations.js
let extra = fs.readFileSync('src/store/extraTranslations.js', 'utf8');
extra = extra.replace("tournament_completed_msg: '锦标赛 “{title}” 已圆满结束并从主页归档。'", "tournament_completed_msg: '锦标赛 “{title}” 已圆满结束。'");
extra = extra.replace("tournament_completed_msg: 'El torneo \"{title}\" se ha concluido con éxito y ha sido archivado del panel principal.'", "tournament_completed_msg: 'El torneo \"{title}\" se ha concluido con éxito.'");
extra = extra.replace("tournament_completed_msg: 'Le tournoi \"{title}\" a été clôturé avec succès et archivé du tableau de bord.'", "tournament_completed_msg: 'Le tournoi \"{title}\" a été clôturé avec succès.'");
fs.writeFileSync('src/store/extraTranslations.js', extra);

// Update useAppStore.js
let appStore = fs.readFileSync('src/store/useAppStore.js', 'utf8');
appStore = appStore.replace("tournament_completed_msg: 'The tournament \"{title}\" has been successfully concluded and archived from the dashboard.'", "tournament_completed_msg: 'The tournament \"{title}\" has been successfully concluded.'");
appStore = appStore.replace("tournament_completed_msg: 'Turnamen \"{title}\" berhasil diselesaikan dan telah diarsipkan dari halaman beranda.'", "tournament_completed_msg: 'Turnamen \"{title}\" berhasil diselesaikan.'");
fs.writeFileSync('src/store/useAppStore.js', appStore);

console.log("Translations successfully updated.");
