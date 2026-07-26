
const sold = DATA.sold;
const target = DATA.target;
const profit = DATA.profit;
const p=sold/target*100;
soldEl.textContent=sold.toLocaleString('ru-RU');
function soldEl(){}

document.getElementById('sold').textContent=sold.toLocaleString('ru-RU');
document.getElementById('left').textContent=(target-sold).toLocaleString('ru-RU')+' пирогов';
document.getElementById('money').textContent=(sold*profit).toLocaleString('ru-RU')+' ₽';
document.getElementById('percent').textContent=p.toFixed(1)+'% выполнено';
document.getElementById('fill').style.width=p+'%';
