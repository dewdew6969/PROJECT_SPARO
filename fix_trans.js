const fs = require('fs');
let extra = fs.readFileSync('src/store/extraTranslations.js', 'utf8');

extra = extra.replace("tournament_completed_success: '锦标赛已完成'", "tournament_completed_success: '锦标赛状态已更新'");
extra = extra.replace("tournament_completed_msg: '锦标赛 \"{title}\" 已成功完成并从仪表板隐藏。'", "tournament_completed_msg: '锦标赛 “{title}” 已圆满结束并从主页归档。'");

extra = extra.replace("tournament_completed_success: 'Torneo Completado'", "tournament_completed_success: 'Estado del Torneo Actualizado'");
extra = extra.replace("tournament_completed_msg: 'El torneo \"{title}\" se ha completado con éxito y se ha ocultado del tablero.'", "tournament_completed_msg: 'El torneo \"{title}\" se ha concluido con éxito y ha sido archivado del panel principal.'");

extra = extra.replace("tournament_completed_success: 'Tournoi Terminé'", "tournament_completed_success: 'Statut du Tournoi Mis à Jour'");
extra = extra.replace("tournament_completed_msg: 'Le tournoi \"{title}\" a été terminé avec succès et masqué du tableau de bord.'", "tournament_completed_msg: 'Le tournoi \"{title}\" a été clôturé avec succès et archivé du tableau de bord.'");

fs.writeFileSync('src/store/extraTranslations.js', extra);
console.log("Translations successfully updated.");
