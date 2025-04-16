var dsturl1 = 'https://etk.srail.kr/hpg/hra/01/selectScheduleList.do?pageId=TK0101010000'

window.showModalDialog = window.showModalDialog || function (url, arg, opt) {
	window.open(url, arg, opt);
};

// Utility functions for session storage
function saveToSessionStorage(key, value) {
	sessionStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
}

function getFromSessionStorage(key, defaultValue = null) {
	const value = sessionStorage.getItem(key);
	if (value === null) return defaultValue;
	try {
		return JSON.parse(value);
	} catch (e) {
		return value;
	}
}

function removeFromSessionStorage(keys) {
	if (Array.isArray(keys)) {
		keys.forEach(key => sessionStorage.removeItem(key));
	} else {
		sessionStorage.removeItem(keys);
	}
}

function clearMacroSessionData() {
	const keysToRemove = [
		'macro', 'coachSelected', 'firstSelected', 'waitingSelected',
		'psgInfoPerPrnb1', 'psgInfoPerPrnb5', 'psgInfoPerPrnb4',
		'psgInfoPerPrnb2', 'psgInfoPerPrnb3', 'locSeatAttCd1', 'rqSeatAttCd1'
	];
	removeFromSessionStorage(keysToRemove);
}

// Trigger click event on 조회하기 button
function triggerTicketSearch() {
	document.querySelector('#search_top_tag > input').click();
}

function getSelectedTrains() {
	return {
		coachSelected: [].map.call(document.querySelectorAll('.coachMacro:checked'), select => select.value),
		firstSelected: [].map.call(document.querySelectorAll('.firstMacro:checked'), select => select.value),
		waitingSelected: [].map.call(document.querySelectorAll('.waitingMacro:checked'), select => select.value)
	};
}

function saveUserPreferences() {
	// Stores user preferences
	const preferenceFields = [
		'psgInfoPerPrnb1', 'psgInfoPerPrnb5', 'psgInfoPerPrnb4',
		'psgInfoPerPrnb2', 'psgInfoPerPrnb3', 'locSeatAttCd1', 'rqSeatAttCd1'
	];

	preferenceFields.forEach(field => {
		const element = document.getElementsByName(field)[0];
		if (element) {
			saveToSessionStorage(field, element.value);
		}
	});
}

function restoreUserPreferences() {
	// Restores user preferences
	const preferenceFields = [
		'psgInfoPerPrnb1', 'psgInfoPerPrnb5', 'psgInfoPerPrnb4',
		'psgInfoPerPrnb2', 'psgInfoPerPrnb3', 'locSeatAttCd1', 'rqSeatAttCd1'
	];

	preferenceFields.forEach(field => {
		const value = getFromSessionStorage(field);
		if (value !== null) {
			$(`#${field}`).val(value);
		}
	});
}

function macrostart() {
	const { coachSelected, firstSelected, waitingSelected } = getSelectedTrains();

	if (coachSelected.length === 0 && firstSelected.length === 0 && waitingSelected.length === 0) {
		alert("매크로를 실행하기 위해서는 예매하기 위한 열차 1개 이상을 선택하십시오.");
	} else {
		alert("매크로를 시작합니다.\n트럼펫 소리가 나면 바로 결제를 해주셔야 합니다.");

		saveToSessionStorage('macro', true);
		saveToSessionStorage('coachSelected', coachSelected);
		saveToSessionStorage('firstSelected', firstSelected);
		saveToSessionStorage('waitingSelected', waitingSelected);

		saveUserPreferences();
		location.reload();
	}
}

function macrostop() {
	alert("매크로를 중지합니다.\n조건을 변경하여 재조회하신 후 다시 시작하실 수 있습니다.");
	clearMacroSessionData();
	location.reload();
}

function createMacroCheckbox(cell, className, value, isChecked) {
	cell.append($("<p class='p5'></p>"));
	const checkbox = $("<label></label>").html(
		`<input type="checkbox" name="checkbox" class="${className}" value="${value}"> 매크로`
	);
	checkbox.children('input').prop('checked', isChecked);
	cell.append(checkbox);
}

function insertMacroButtons() {
	const rows = $('#search-list table tr');
	const coachSelected = getFromSessionStorage('coachSelected', []);
	const firstSelected = getFromSessionStorage('firstSelected', []);
	const waitingSelected = getFromSessionStorage('waitingSelected', []);

	for (let i = 1; i < rows.length; i++) {
		const columns = $(rows[i]).children('td');
		const first = $(columns[5]);
		const coach = $(columns[6]);
		const waiting = $(columns[7]);

		if (coach.children().length > 0) {
			createMacroCheckbox(coach, 'coachMacro', i, coachSelected.includes(i + ""));
		}
		if (first.children().length > 0) {
			createMacroCheckbox(first, 'firstMacro', i, firstSelected.includes(i + ""));
		}
		if (waiting.children().length > 0) {
			createMacroCheckbox(waiting, 'waitingMacro', i, waitingSelected.includes(i + ""));
		}
	}
}

function setupUI() {
	const isMacroRunning = getFromSessionStorage('macro');
	const buttonHtml = isMacroRunning ?
		'<a href="#" id="btnstop" style="margin-left:5px;display:inline-block;height:100%;vertical-align:middle;"><img src="' + chrome.runtime.getURL('images/btn_stop.png') + '"></a>' :
		'<a href="#" id="btnstart" style="margin-left:5px;display:inline-block;height:100%;vertical-align:middle;"><img src="' + chrome.runtime.getURL('images/btn_start.png') + '"></a>';

	$("div#search_top_tag.tal_c.mgt30").append(buttonHtml);

	const btnstop = document.getElementById("btnstop");
	const btnstart = document.getElementById("btnstart");

	if (btnstop) {
		btnstop.addEventListener("click", macrostop, false);
	}
	if (btnstart) {
		btnstart.addEventListener("click", macrostart, false);
	}

	// Add custom CSS
	$("<style>")
		.prop("type", "text/css")
		.html("\
.search-form form .button input, .search-form form .button a img{\
	vertical-align: middle;\
}")
		.appendTo("body");
}

function isReservationButton(element) {
	const name = $(element).attr('class');
	const spans = $(element).children('span');
	const text = spans.length > 0 ? $(spans[0]).text() : '';
	return name === 'btn_small btn_burgundy_dark val_m wx90' && text === '예약하기';
}

function tryReservationForType(cell, rowIndex, selectedRows) {
	if (selectedRows.includes(rowIndex + "")) {
		const buttons = cell.children("a");
		if (buttons.length !== 0) {
			for (let j = 0; j < buttons.length; j++) {
				if (isReservationButton(buttons[j])) {
					$(buttons[0])[0].click();
					return true;
				}
			}
		}
	}
	return false;
}

function processReservations() {
	const rows = $('#search-list table tr');
	const coachSelected = getFromSessionStorage('coachSelected', []);
	const firstSelected = getFromSessionStorage('firstSelected', []);
	const waitingSelected = getFromSessionStorage('waitingSelected', []);

	let succeed = false;

	for (let i = 1; i < rows.length; i++) {
		const columns = $(rows[i]).children('td');
		const first = $(columns[5]);
		const coach = $(columns[6]);
		const waiting = $(columns[7]);

		// Try coach seats first
		if (tryReservationForType(coach, i, coachSelected)) {
			succeed = true;
			break;
		}

		// Then try first class
		if (tryReservationForType(first, i, firstSelected)) {
			succeed = true;
			break;
		}

		// Finally try waiting list
		if (tryReservationForType(waiting, i, waitingSelected)) {
			succeed = true;
			break;
		}
	}

	return succeed;
}

function dismissCoronaAlert() {
	const dialogButtonSet = document.querySelector('.ui-dialog-buttonset');
	if (dialogButtonSet) {
		const uiButton = dialogButtonSet.querySelector('.ui-button');
		if (uiButton) {
			uiButton.click();
		}
	}
}

function runMacro() {
	restoreUserPreferences();

	if ($("#search-list").length !== 0) {
		const succeed = processReservations();

		if (succeed) {
			clearMacroSessionData();
			chrome.runtime.sendMessage({ type: 'playSound' }, function (data) { });
			dismissCoronaAlert();
		} else {
			setTimeout(function () {
				location.reload();
			}, 1000);
		}
	} else {
		triggerTicketSearch();
	}
}

if (document.URL.substring(0, dsturl1.length) == dsturl1) {
	$(document).ready(function () {
		setupUI();

		// Insert macro checkboxes if we're on the search results page
		if ($("#search-list").length !== 0) {
			insertMacroButtons();
		}

		// Run macro if it's active
		if (getFromSessionStorage('macro')) {
			runMacro();
		}
	});
}
