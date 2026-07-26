const SHEET_URL = "https://opensheet.elk.sh/1oSAvRDiEZjLkqtsUgakFVGTM39uPEo_aFjRC1rkXBRE/Лист1";


fetch(SHEET_URL)
.then(response => response.json())
.then(data => {

const sold = Number(data[0].sold);
const target = Number(data[0].target);
const profit = Number(data[0].profit);


document.getElementById('sold').textContent =
sold.toLocaleString('ru-RU');


document.getElementById('left').textContent =
(target - sold).toLocaleString('ru-RU') + " пирогов";


document.getElementById('money').textContent =
(sold * profit).toLocaleString('ru-RU') + " ₽";


const percent = sold / target * 100;


document.getElementById('percent').textContent =
percent.toFixed(1) + "% выполнено";


document.getElementById('fill').style.width =
percent + "%";


})
.catch(error => {
console.log("Ошибка загрузки таблицы:", error);
});
