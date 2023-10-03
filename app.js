const lunchSelector = document.getElementById("lunchSelector");
const scheduleContents = document.getElementById("scheduleContents");
const message = document.getElementById("message");
const scheduleSelectionDropDown = {
    parentButtonID: "manualScheduleSelection",
    contentID: "dropDownContent",
};
const scheduleName = document.getElementById("scheduleName");
const autoSchedulePickingInput = document.getElementById("autoSchedulePickingInput");
const scheduleTimeRefreshRate = document.getElementById("scheduleTimeRefreshRate");

const LUNCH_KEY = "lunchType";
const REFRESH_KEY = "refreshRate";
var schedulesLibrary;
var lunch;
var loadedSchedule;
var rawScheduleContents;
const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthsOfYear = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var doAutoPicking = true;
var refreshRate = 60;
var timeLeftIntervalID;
var clockRunning = false;

/**
 * Work on:
 *  - ✔️ Switching schedules manually with loadSchedule()
 *     - ✔️ Correctly fill in the dropdown menu
 *     - ✔️ Make sure selecting a schedule actually works
 *  - ✔️ UI of settings menu
 *  - ✔️ Create a clock on the page
 *  - ✔️ Format time so that there is no seconds place
 *  - ✔️ Add favicon
 *  - ✔️ Fix the colors of icons
 *  - Automatically selecting the right schedule.
 *  - Add more schedules
 *  - Document/comment code
 *  - Clean up console output
 *  - Add links to some documentation (new page for that?? Cool)
 *     - Be cool to make a tutorial page on how to add custom schedules????
 *  - Update github repo
 *
 *  - Make python script to create schedulesLibrary.json
 *  - Create a page of my tools (Schedule, Molar Mass Calculator Cooler!)
 *
 * ❌ : ✔️
 */

async function getScheduleLibrary() {
    await fetch("assets/schedulesLibrary.json")
        .then(function (u) {
            return u.json();
        })
        .then(function (json) {
            schedulesLibrary = json;

            // Update the dropdown so you can switch between schedules
            loadDDContent(scheduleSelectionDropDown, schedulesLibrary);
        });
}

function loadDDContent(dropDownID, content) {
    for (let i = 0; i < content.length; i++) {
        const element = content[i].name;

        let a = document.createElement("h4");
        a.setAttribute("href", "#");
        a.classList.add("dropdown-item");
        a.classList.add("drop-down-dark");
        a.setAttribute("id", `dd${i}`);
        a.setAttribute("onclick", `handleDDItemClicked('${dropDownID.parentButtonID}', 'dd${i}')`);
        a.dataset.index = i;
        a.innerHTML = element;

        document.getElementById(dropDownID.contentID).appendChild(a);
    }

    // <a href="#" class="dropdown-item" id="dd1"
    //     onclick="handleDDItemClicked('manualScheduleSelection', this.id)">
    //     Early Release w/ Advisory
    // </a>
}

function loadSchedule(scheduleIndex) {
    Papa.parse(schedulesLibrary[scheduleIndex].location, {
        download: true,
        complete: function (results) {
            loadedSchedule = parseSchedule(results);
            // drawScheduleContent(loadedSchedule);
            rawScheduleContents = results;
            let title = results.data[0][0].split(": ")[1];
            scheduleName.innerHTML = title;
            document.getElementById(`${scheduleSelectionDropDown.parentButtonID}Name`).innerHTML = title;
            handleLunchChange();
            if (!clockRunning) {
                clock();
            }
        },
    });
}

function handleAutoToggle() {
    doAutoPicking = autoSchedulePickingInput.checked;
}

function handleLunchChange() {
    lunch = lunchSelector.checked == true ? "A" : "B";
    localStorage.setItem(LUNCH_KEY, lunch);

    console.log(`Switching to ${lunch} lunch`);
    update();
}

function handleRefreshRateChange() {
    console.log(scheduleTimeRefreshRate.value);
    refreshRate = parseInt(scheduleTimeRefreshRate.value);
    localStorage.setItem(REFRESH_KEY, refreshRate);

    clearInterval(timeLeftIntervalID);
    timeLeftIntervalID = null;
}

function parseSchedule(parsedCSV) {
    // console.log(parsedCSV.data);
    scheduleObject = {
        aLunch: [],
        bLunch: [],
    };

    for (let i = 0; i < parsedCSV.data.length; i++) {
        const element = parsedCSV.data[i];

        // console.log(element[0]);
        const value = element[0];

        readingLunch = "A";
        if (value === "A Lunch") {
            for (let j = i + 2; j < parsedCSV.data.length; j++) {
                const element = parsedCSV.data[j];
                if (readingLunch === "A" && parsedCSV.data[j][0] === "B Lunch") {
                    readingLunch = "B";
                    j += 1;
                } else {
                    var info = { period: element[0], start: element[1], end: element[2] };

                    if (readingLunch === "A") {
                        scheduleObject.aLunch.push(info);
                    } else {
                        scheduleObject.bLunch.push(info);
                    }
                }

                // console.log(`reading lunch: ${readingLunch}, element: ${element}`);
            }
        }
    }
    // console.log(scheduleObject);
    return scheduleObject;
}

/**
 * Draws out the schedule to the ui.
 * @param {*} schedule Schedule json object to be drawn.
 */
function drawScheduleContent(schedule) {
    schedule = lunch === "A" ? schedule.aLunch : schedule.bLunch;
    scheduleContents.innerHTML = "";

    schedule.forEach((element) => {
        createScheduleRow(element);
    });
}

function createScheduleRow(contents) {
    var newRow = document.createElement("li");
    var container = document.createElement("div");

    container.classList.add("is-flex");
    container.classList.add("row");
    container.setAttribute("id", contents.period);

    var name = document.createElement("div");
    name.classList.add("schedule-item");
    name.innerHTML = contents.period;

    var time = document.createElement("div");
    time.classList.add("schedule-time");
    time.innerHTML = `${formatAMPM(
        parseTimeString(contents.start)
    )} <i class="fa-solid fa-arrow-right seperator"></i> ${formatAMPM(parseTimeString(contents.end))}`;

    container.append(name);
    container.append(time);

    newRow.append(container);

    scheduleContents.appendChild(newRow);
}

function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;
    var strTime = hours + ":" + minutes + " " + ampm;
    return strTime;
}

function setMessageText(txt) {
    message.innerHTML = txt;
}

function setSelected(period) {
    let row = document.getElementById(period);

    if (row.classList.contains("is-selected")) return;
    row.classList.add("is-selected");
}

function removeSelected(period) {
    let row = document.getElementById(period);

    if (!row.classList.contains("is-selected")) return;
    row.classList.remove("is-selected");
}

function findCurrentPeriod(schedule) {
    schedule = lunch === "A" ? schedule.aLunch : schedule.bLunch;

    let timeNow = new Date();
    // Debugging:
    // timeNow.setHours(9);
    // timeNow.setMinutes(12);

    // console.log(timeNow);

    // Check if we are in any period.
    let found = false;
    schedule.forEach((element) => {
        var startTime = parseTimeString(element.start);
        var endTime = parseTimeString(element.end);
        var inPeriod = timeNow < endTime && timeNow > startTime ? true : false; // compare

        if (inPeriod) {
            // In a period, remove all the selected items first
            schedule.forEach((element) => {
                removeSelected(element.period);
            });
            // Then select the right period.
            setSelected(element.period);
            found = true;

            // Find how much more class time is left.
            // console.log(endTime);
            setMessageText(getTimeLeft(endTime, timeNow));
        }
    });

    // Not in a period, check if its a passing period or if school is even in session.
    if (!found) {
        // Okay are we in school hours?
        var startTime = parseTimeString(schedule[0].start);
        var endTime = parseTimeString(schedule[schedule.length - 1].end);
        var inSchool = timeNow < endTime && timeNow > startTime ? true : false;

        if (inSchool) {
            // We in school but what passing period are we in then?
            console.log("Nope your still in school. Must be a passing period.");
            setMessageText("Nope your still in school. Must be a passing period.");

            for (let i = 0; i < schedule.length - 1; i++) {
                const element = schedule[i];

                var startTime = parseTimeString(element.end);
                var endTime = parseTimeString(schedule[i + 1].start);
                var inPassing = timeNow < endTime && timeNow > startTime ? true : false; // compare

                if (inPassing) {
                    // In a passing period.
                    // Lets find out how much more time is left.

                    console.log(
                        `Get to ${schedule[i + 1].period}. You got ${
                            endTime.getMinutes() - timeNow.getMinutes()
                        } minute(s)`
                    );
                    setMessageText(
                        `Get to ${schedule[i + 1].period}. You got ${
                            endTime.getMinutes() - timeNow.getMinutes()
                        } minute(s)`
                    );
                }
            }
        } else {
            document.title = "OHHS Schedule";
            console.log("Why are you checking the schedule when your not at school? Nerd 🤓");
            setMessageText("Why are you checking the schedule when your not at school? Nerd 🤓");
        }
    }
}

/**
 * Parses a time(Ex. "9:00 AM") and returns the current date at that time.
 * @param d The string date to parse.
 */
function parseTimeString(d) {
    var parts = d.split(/:|\s/),
        date = new Date();
    if (parts.pop().toLowerCase() == "pm") parts[0] = +parts[0] + 12;
    date.setHours(+parts.shift());
    date.setMinutes(+parts.shift());
    date.setSeconds(0);
    return date;
}

/**
 * Finds the amount of time left in a given period.
 * @param endTime The time that the current period ends.
 * @param dateNow The current time. (Or other time to measure to)
 * @returns A string including the time left in the period.
 */
function getTimeLeft(endTime, dateNow) {
    // console.log(endTime);
    var hrsLeft = endTime.getHours() - dateNow.getHours();
    var minsLeft = endTime.getMinutes() - dateNow.getMinutes();
    var timeLeft = new Date();
    var oneHrLeft = new Date();
    oneHrLeft.setHours(1, 0, 0, 0);
    var oneMinLeft = new Date();
    oneMinLeft.setHours(0, 1, 0, 0);
    timeLeft.setHours(hrsLeft, minsLeft, 0, 0);

    if (timeLeft.getHours() >= 1 && timeLeft.getMinutes() <= 1) {
        document.title = `${timeLeft.getHours()}:${timeLeft.getMinutes()} left`;
        return `There is <mark class="important-text">${timeLeft.getHours()} hour </mark> and <mark class="important-text">${timeLeft.getMinutes()} minute</mark> left in this period`;
    } else if (timeLeft >= oneHrLeft && timeLeft.getMinutes() > 1) {
        document.title = `${timeLeft.getHours()}:${timeLeft.getMinutes()} left`;
        return `There is <mark class="important-text">${timeLeft.getHours()} hour </mark>  and <mark class="important-text">${timeLeft.getMinutes()} minutes</mark> left in this period`;
    } else if (timeLeft.getMinutes() > 1) {
        document.title = `${timeLeft.getMinutes()} minutes left`;
        return `There are <mark class="important-text">${timeLeft.getMinutes()} minutes </mark> left in this period`;
    } else if (timeLeft.getMinutes() <= 1) {
        document.title = `${timeLeft.getMinutes()} minute left`;
        return `There is <mark class="important-text">${timeLeft.getMinutes()} minute </mark> left in this period`;
    }
}

function update() {
    drawScheduleContent(loadedSchedule);
    findCurrentPeriod(loadedSchedule);
}

function handleDropDown(id) {
    document.getElementById(id).classList.toggle("is-active");
}

function handleDDItemClicked(parentID, itemID) {
    handleDropDown(parentID);

    // Set the text of the drop down to the selected item.
    document.getElementById(`${parentID}Name`).innerHTML = document.getElementById(itemID).innerHTML;

    loadSchedule(document.getElementById(itemID).dataset.index);
}

function clock() {
    let date = new Date();
    let hh = date.getHours();
    let mm = date.getMinutes();
    let ss = date.getSeconds();
    let session = "AM";
    const dayOfWeek = daysOfWeek[date.getDay()];
    const month = monthsOfYear[date.getMonth()];
    const dayOfMonth = date.getDate();

    // Update schedule every 10 minutes
    // if ((mm % 10 == 0 && doAutoPicking) || firstRun) {
    //     let i = 0;
    //     firstRun = false;
    //     schedulesLibrary.forEach((element) => {
    //         element.appliesTo.forEach((day) => {
    //             if (day.toLowerCase() === dayOfWeek.toLowerCase()) {
    //                 loadSchedule(i);
    //             }
    //         });
    //         i++;
    //     });
    // }

    if (hh == 0) {
        hh = 12;
    }
    if (hh > 12) {
        hh = hh - 12;
        session = "PM";
    }

    hh = hh < 10 ? "0" + hh : hh;
    mm = mm < 10 ? "0" + mm : mm;
    ss = ss < 10 ? "0" + ss : ss;

    let time = hh + ":" + mm + ":" + ss + " " + session;

    const formattedDate = `${dayOfWeek}, ${month} ${dayOfMonth}`;

    // Update the time left synced with the clock.
    if (timeLeftIntervalID == null) {
        if (ss == "00" || ss == refreshRate || ss % refreshRate === 0) {
            updateTimeLeft();
        }
    }
    document.getElementById("clock").innerText = time;
    document.getElementById("date").innerHTML = formattedDate;
    let t = setTimeout(function () {
        clock();
    }, 1000);
}

function updateTimeLeft() {
    timeLeftIntervalID = setInterval(() => {
        console.log("Refreshing.");
        findCurrentPeriod(loadedSchedule);
    }, refreshRate * 1000);
}

function findScheduleIndex() {
    let date = new Date();
    const dayOfWeek = daysOfWeek[date.getDay()];

    if (doAutoPicking) {
        for (let i = 0; i < schedulesLibrary.length; i++) {
            const element = schedulesLibrary[i];
            for (let j = 0; j < element.appliesTo.length; j++) {
                const day = element.appliesTo[j];
                if (day === dayOfWeek) {
                    console.log(day);
                    console.log(element.location);
                    console.log(i);
                    return i;
                }
            }
        }
    }
}

window.onload = async () => {
    lunch = localStorage.getItem(LUNCH_KEY);
    refreshRate = localStorage.getItem(REFRESH_KEY);
    scheduleTimeRefreshRate.value = refreshRate;
    lunchSelector.checked = lunch == "A" ? true : false;
    autoSchedulePickingInput.checked = true;

    await getScheduleLibrary();
    console.log(findScheduleIndex());
    loadSchedule(findScheduleIndex());
    // loadSchedule(0);
    // clock();
    // updateTimeLeft();
    // findScheduleIndex();
};

// Dubbing
function addClass(el, className) {
    if (el.classList) el.classList.add(className);
    else if (!hasClass(el, className)) el.className += " " + className;
}
