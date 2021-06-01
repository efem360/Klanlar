// ==UserScript==
// @name                Otomatik Kademe Basma
// @version             TRakinci_v1.1
// @description         Otomatik Kademe Basma Script
// @author              design efem360
// @icon                https://yunti.files.wordpress.com/2019/01/turk_bayragi_02_tam35blog.gif
// @include             https://tr(server).klanlar.org/game.php?village=(ID)&screen=main
// @downloadURL         https://raw.githubusercontent.com/efem360/Klanlar/master/Otomatik%20Kademe%20Basma.js
// @updateURL           https://raw.githubusercontent.com/efem360/Klanlar/master/Otomatik%20Kademe%20Basma.js
// ==/UserScript==

/**
 * Aslinda bu isler bedavaya olmuyor ama yinede destek olmak istersen efem360@gmail.com 'a mesaj atabilirsin :)
 */
(async (ModuleLoader) => {
    'use strict';

    // Dependency loading
    await ModuleLoader.loadModule('utils/notify-utils');

    // Controls the window title
    TwFramework.setIdleTitlePreffix('Aktif', document.title);

    let buildingObject;
    let selection;
    let scriptStatus = false; // false == script calismiyor, true == script calisiyor
    let isBuilding = false; // Ayni binalarin birden fazla kuruk gondermesini engeller. false == bina insa edilebilir


    class BQueue {
        constructor(bQueue, bQueueLength) {
            this.buildingQueue = bQueue;
            this.buildingQueueLength = bQueueLength;
        }
        add(building, display) {
            this.buildingQueue.push(building);
            if (display) {
                let ele = document.createElement("tr");
                ele.innerHTML = `<td>${building}</td>
                <td class="delete-icon-large hint-toggle float_left"></td>`;
                ele.addEventListener("click", () => {
                    this.removeBuilding(ele);
                });
                document.getElementById("autoBuilderTable").appendChild(ele);
            }
        }
        /**
         * Binalari bir tabloya ekler
         * @param {DOM element} parent The element (table) where the buildings should be appended to.
         */
        display(parent) {
            this.buildingQueue.forEach((building) => {
                let ele = document.createElement("tr");
                ele.innerHTML = `<td>${building}</td>
                <td class="delete-icon-large hint-toggle float_left"></td>`;
                ele.addEventListener("click", () => {
                    this.removeBuilding(ele);
                });
                parent.appendChild(ele);
            });
        }
        removeBuilding(ele) {
            this.buildingQueue.splice(ele.rowIndex - 3, 1);
            ele.remove();
            localStorage.buildingObject = JSON.stringify(buildingObject);
        }
    }

    init();

function init() {
    const putEleBefore = document.getElementById("content_value");
    let newDiv = document.createElement("div");
    const selectBuildingHtml = "<td><select id=\"selectBuildingHtml\"> " +
        "<option value=\"main\">Ana Bina</option> " +
        "<option value=\"barracks\">Kisla</option> " +
        "<option value=\"stable\">Ahir</option> " +
        "<option value=\"garage\">Atolye</option> " +
        "<option value=\"watchtower\">Gozcu Kulesi</option> " +
        "<option value=\"smith\">Demirci</option> " +
        "<option value=\"market\">Pazar</option> " +
        "<option value=\"wood\">Oduncu</option> " +
        "<option value=\"stone\">Kil Ocagi</option> " +
        "<option value=\"iron\">Demir Madeni</option> " +
        "<option value=\"farm\">Ciftlik</option> " +
        "<option value=\"storage\">Depo</option> " +
        "<option value=\"hide\">Gizli Depo</option> " +
        "<option value=\"wall\">Sur</option> " +
        "</select></td>";
    let newTable = `<table id="autoBuilderTable">
        <tr>
            <td><button id="startBuildingScript" class="btn">Baslat</button></td>
        </tr>
        <tr>
            <td>Kuyruk Limiti:</td>
            <td><input id='queueLengthInput' style='width:30px'></td>
            <td><button id='queueLengthBtn' class='btn'>Tamam</button></td>
            <td><span id='queueText'></span></td>
        </tr>
        <tr>
            <td>Kademe Bas:</td>
            ${selectBuildingHtml}
            <td><button id='addBuilding' class='btn'>Ekle</button></td>
        </tr>
        </table>`;

        newDiv.innerHTML = newTable;
        putEleBefore.parentElement.parentElement.insertBefore(newDiv, putEleBefore.parentElement);

        selection = document.getElementById("selectBuildingHtml");
        let premiumBQueueLength = game_data.features.Premium.active ? 5 : 2;

        // Checks if localStorage exists
        if (localStorage.buildingObject) {
            // Checks if village exists in localStorage
            if (JSON.parse(localStorage.buildingObject)[game_data.village.id]) {
                let newBqueue = JSON.parse(localStorage.buildingObject)[game_data.village.id];
                buildingObject = new BQueue(newBqueue.buildingQueue, newBqueue.buildingQueueLength); // Save stored BQueue in new BQueue
                document.getElementById("queueLengthInput").value = buildingObject.buildingQueueLength;
                // Add each building in the BQueue to the actual queue
                buildingObject.buildingQueue.forEach((b) => {
                    addBuilding(b);
                });
            }
            // Else create empty village and add into localStorage
            else {
                buildingObject = new BQueue([], premiumBQueueLength);
                document.getElementById("queueLengthInput").value = premiumBQueueLength;
                let setLocalStorage = JSON.parse(localStorage.buildingObject);
                setLocalStorage[game_data.village.id] = buildingObject;
                localStorage.buildingObject = JSON.stringify(setLocalStorage);
            }
        }
        // Else create new object
        else {
            buildingObject = new BQueue([], premiumBQueueLength);
            let newLocalStorage = {
                [game_data.village.id]: buildingObject
            };
            localStorage.buildingObject = JSON.stringify(newLocalStorage);
        }

        eventListeners();

        if (localStorage.scriptStatus) {
            scriptStatus = JSON.parse(localStorage.scriptStatus);
            if (scriptStatus) {
                document.getElementById("startBuildingScript").innerText = "Durdur";
                startScript();
            }
        }
    }


    function startScript() {
        let currentBuildLength = 0;
        if (document.getElementById("buildqueue")) {
            currentBuildLength = document.getElementById("buildqueue").rows.length - 2;
        }
        setInterval(function () {
            let btn = document.querySelector(".btn-instant-free");
            if (btn && btn.style.display != "none") {
                btn.click();
            }
            if (buildingObject.buildingQueue.length !== 0) {
                let building = buildingObject.buildingQueue[0];
                let wood = parseInt(document.getElementById("wood").textContent);
                let stone = parseInt(document.getElementById("stone").textContent);
                let iron = parseInt(document.getElementById("iron").textContent);
                let woodCost = 9999999;
                let stoneCost = 9999999;
                let ironCost = 9999999;

                try {
                    woodCost = parseInt(document.querySelector("#main_buildrow_" + building + " > .cost_wood").getAttribute("data-cost"));
                    stoneCost = parseInt(document.querySelector("#main_buildrow_" + building + " > .cost_stone").getAttribute("data-cost"));
                    ironCost = parseInt(document.querySelector("#main_buildrow_" + building + " > .cost_iron").getAttribute("data-cost"));
                } catch (e) {
                    console.log("Error getting building cost");
                }

                if (document.getElementById("buildqueue")) {
                    currentBuildLength = document.getElementById("buildqueue").rows.length - 2;
                }
                if (currentBuildLength < buildingObject.buildingQueueLength && !isBuilding && scriptStatus && wood >= woodCost && stone >= stoneCost && iron >= ironCost) {
                    isBuilding = true;
                    console.log("Sending build order for " + building);
                    setTimeout(function () {
                        buildBuilding(building);
                    }, Math.floor(Math.random() * 500 + 1000));
                }
            }
        }, 1000);
    }

    function addBuilding(building) {
        let ele = document.createElement("tr");
        ele.innerHTML = `<td>${building}</td>
    <td class="delete-icon-large hint-toggle float_left" style="cursor:pointer"></td>`;
        ele.childNodes[2].addEventListener("click", function () {
            removeBuilding(ele);
        });
        document.getElementById("autoBuilderTable").appendChild(ele);
    }

    /**
     * Removes the row of the building that should be removed. -3 because there are three other rows in the table
     * @param {DOM} ele table row of building queue to be removed
     */
    function removeBuilding(ele) {
        buildingObject.buildingQueue.splice(ele.rowIndex - 3, 1);
        let setLocalStorage = JSON.parse(localStorage.buildingObject);
        setLocalStorage[game_data.village.id] = buildingObject;
        localStorage.buildingObject = JSON.stringify(setLocalStorage);
        ele.remove();
    }

    function buildBuilding(building) {
        let data = {
            "id": building,
            "force": 1,
            "destroy": 0,
            "source": game_data.village.id,
            "h": game_data.csrf
        };
        let url = "/game.php?village=" + game_data.village.id + "&screen=main&ajaxaction=upgrade_building&type=main&";
        $.ajax({
            url: url,
            type: "post",
            data: data,
            headers: {
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "TribalWars-Ajax": 1
            }
        }).done(function (r) {
            let response = JSON.parse(r);
            if (response.error) {
                UI.ErrorMessage(response.error[0]);
                console.error(response.error[0]);
            } else if (response.response.success) {
                UI.SuccessMessage(response.response.success);
                console.log(response.response.success);
                // TODO: might cause issues because of async
                buildingObject.buildingQueue.splice(0, 1);
                let setLocalStorage = JSON.parse(localStorage.buildingObject);
                setLocalStorage[game_data.village.id] = buildingObject;
                localStorage.buildingObject = JSON.stringify(setLocalStorage);
                document.querySelector("#autoBuilderTable > tr").remove();
                setTimeout(() => {
                    window.location.reload();
                }, Math.floor(Math.random() * 50 + 500));
            }
        }).fail(function () {
            UI.ErrorMessage("Something bad happened. Please contact FunnyPocketBook#9373");
            console.log("Something bad happened. Please contact FunnyPocketBook#9373");
        }).always(function () {
            isBuilding = false;
        });
    }


    function eventListeners() {
        // #region Query
        // Kuyruk Uzunlugu"
        document.getElementById("queueLengthInput").addEventListener("keydown", clickOnKeyPress.bind(this, 13, "#queueLengthBtn"));

        // Saves query length
        document.getElementById("queueLengthBtn").addEventListener("click", function () {
            let qLength = parseInt(document.getElementById("queueLengthInput").value);
            if (Number.isNaN(qLength)) {
                qLength = 2;
            }
            if (!game_data.features.Premium.active && qLength > 2) {
                buildingObject.buildingQueueLength = 2;
            } else {
                buildingObject.buildingQueueLength = qLength;
            }
            let setLocalStorage = JSON.parse(localStorage.buildingObject);
            setLocalStorage[game_data.village.id] = buildingObject;
            localStorage.buildingObject = JSON.stringify(setLocalStorage);
            if (!game_data.features.Premium.active && qLength > 2) {
                document.getElementById("queueText").innerHTML = " Premium Hesap acik olmadigi icin en fazla ekleyebileceginiz kuyruk limiti 2 dir.";
            } else if (parseInt(buildingObject.buildingQueueLength) > 5) {
                document.getElementById("queueText").innerHTML = " Sira limiti ayarlandi. " + buildingObject.buildingQueueLength + ". Kuyrukta 5'ten fazla insaat icin ek maliyetler olacaktir.";
            } else {
                document.getElementById("queueText").innerHTML = " Sira limiti ayarlandi. " + buildingObject.buildingQueueLength;
            }
            document.getElementById("queueLengthInput").value = buildingObject.buildingQueueLength;
        });
        // #endregion Query

        // #region Building
        document.getElementById("addBuilding").addEventListener("click", function () {
            let b = selection.options[selection.selectedIndex].value;
            buildingObject.buildingQueue.push(selection.options[selection.selectedIndex].value);
            let setLocalStorage = JSON.parse(localStorage.buildingObject);
            setLocalStorage[game_data.village.id] = buildingObject;
            localStorage.buildingObject = JSON.stringify(setLocalStorage);
            addBuilding(b);
        });
        document.getElementById("startBuildingScript").addEventListener("click", function () {
            if (document.getElementById("startBuildingScript").innerText === "Baslat") {
                document.getElementById("startBuildingScript").innerText = "Durdur";
                scriptStatus = true;
                localStorage.scriptStatus = JSON.stringify(scriptStatus);
                startScript();
            } else {
                document.getElementById("startBuildingScript").innerText = "Baslat";
                scriptStatus = false;
                localStorage.scriptStatus = JSON.stringify(scriptStatus);
            }
        });
        // #endregion Building
    }

    /**
     * Triggers a click on a keypress
     * @param {int} key key that has been pressed
     * @param {string} selector CSS selector of the element that is to be triggered
     */
    function clickOnKeyPress(key, selector) {
        "use strict";
        if (event.defaultPrevented) {
            return; // Should do nothing if the default action has been cancelled
        }
        let handled = false;
        if (event.key === key || event.keyCode === key || event.keyIdentifier === key) {
            document.querySelector(selector).click();
            handled = true;
        }
        if (handled) {
            event.preventDefault();
        }
    }

})({
    // ModuleLoader functions
    loadModule: moduleName => {
        return new Promise((resolve, reject) => {
            const modulePath = moduleName.replace('.', '/');
            const moduleUrl = `https://raw.githubusercontent.com/joaovperin/TribalWars/master/Modules/${modulePath}.js`;
            console.debug('[TwScripts] Loading ', modulePath, ' from URL ', moduleUrl, '...');
            return $.ajax({
                    method: "GET",
                    url: moduleUrl,
                    dataType: "text"
                }).done(res => resolve(eval(res)))
                .fail(req => reject(console.error("[TwScripts] Fail loading module '", moduleName, "'.")));
        })
    }
});
