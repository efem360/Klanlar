// ==UserScript==
// @isim                Saldiri Savunma Gor
// @version             TRakinci_v1.1
// @description         Koylerin Profil sayfasinda gelen saldiri ve savunma birliklerini toplu halde gorme
// @sahibi              design efem360
// @icon                https://yunti.files.wordpress.com/2019/01/turk_bayragi_02_tam35blog.gif
// @include             https://tr65.klanlar.org/game.php?village=178&screen=info_village*
// @updateURL           https://raw.githubusercontent.com/efem360/Klanlar/master/Gelen-Saldiri-Savunma-Gor.js
// ==/UserScript==

/**
 * 
 * Unutma! Bilgi paylastikca buyur..
 *
 * Aslinda bu isler bedavaya olmuyor ama yinede destek olmak istersen efem360@gmail.com 'a mesaj atabilirsin :)
 *
 * @param {String} unitConfig Birimleri Yapilandirma
 */
((unitConfig) => {
    'use strict';

    //****************************** Configuration ******************************//
    const showHaulCapacity = true;
    //*************************** End Configuration ***************************//

    const titleParent = $("#content_value > table:nth-child(3) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(2)");
    titleParent.append($(unitConfig));

    /**
     * Represents the units in a command
     */
    class Units {
        constructor(spear, sword, axe, archer, spy, light, marcher, heavy, ram, catapult, knight, snob) {
            this.spear = spear;
            this.sword = sword;
            this.axe = axe;
            this.archer = archer;
            this.spy = spy;
            this.light = light;
            this.marcher = marcher;
            this.heavy = heavy;
            this.ram = ram;
            this.catapult = catapult;
            this.knight = knight;
            this.snob = snob;
        }

        get haul() {
            return this.spear * 25 + this.sword * 15 + this.axe * 10 + this.archer * 10 +
                this.light * 80 + this.marcher * 50 + this.heavy * 50 + this.knight * 100;
        }
    }


    let attackIncs = []; // Store shared incoming attacks
    let supportIncs = []; // Store shared incoming supports
    let sharedSupport = false; // true if one incoming support is shared
    let sharedAttack = false; // true if one incoming attack is shared

    let table = document.querySelector(".commands-container table:nth-child(1)"); // Incoming commands table
    // Evaluate every incoming command
    for (let i = 2; i <= table.rows.length; i++) {
        let inc = table.querySelector("tr.command-row:nth-child(" + i + ") > td:nth-child(1) > span:nth-child(1) > span:nth-child(1) > a:nth-child(1) > span:nth-child(1) > span:nth-child(1)");
        if (inc.attributes["data-command-type"] == undefined) { // Don't store incoming command if not shared
            continue;
        } else if (inc.attributes["data-command-type"].value === "support") {
            supportIncs.push(inc);
            sharedSupport = true;
        } else if (inc.attributes["data-command-type"].value === "attack") {
            attackIncs.push(inc);
            sharedAttack = true;
        }
    }

    if (sharedAttack) {
        getUnits(attackIncs);
    }
    if (sharedSupport) {
        getUnits(supportIncs);
    }

    /**
     * Calculates total amount of incoming troops
     *
     * @param {String[]} incomings Array of incoming commands
     */
    function getUnits(incomings) {
        let type;
        if (incomings[0].attributes["data-command-type"].value == "support") {
            type = "support";
        } else {
            type = "attack";
        }
        let counterGetAmnt = 0; // Counts amount of processed commands
        let incUnits = new Units(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        let timeout = 0;
        if (incomings.length === 0) {
            return;
        }
        // Get units of each incoming command
        incomings.forEach(function (ele) {
            let id = ele.getAttribute("data-command-id"); // Get command ID
            timeout += Math.random() * 70 + 40;
            // Get request for command details and extract amount of troops
            setTimeout(function () {
                $.get(window.location.origin + "/game.php?village=" + game_data.village.id + "&screen=info_command&ajax=details&id=" + id, function (response) {
                    let responseUnits = response.units;
                    counterGetAmnt++;
                    if (type === "attack") {
                        document.getElementById("attackText").innerText = "Processing " + counterGetAmnt + "/" + incomings.length + " commands";
                    } else {
                        document.getElementById("supportText").innerText = "Processing " + counterGetAmnt + "/" + incomings.length + " commands";
                    }
                    // Add the units from the response together
                    Object.keys(responseUnits).forEach((key) => {
                        incUnits[key] += parseInt(responseUnits[key].count);
                    });
                    // If all incoming commands have been processed, write the total number of troops into the table
                    if (counterGetAmnt == incomings.length) {
                        writeUnits(incomings, incUnits);
                    }
                });
            }, timeout)
        });
    }

    /**
     * Write units to table
     *
     * @param {HtmlElement}[]} Gelen Komutlar Dizisi
     * @param {String}[]} incUnits Array of incoming units
     */
    function writeUnits(incomings, incUnits) {
        let myTable;
        if (incomings[0].attributes["data-command-type"].value == "support") {
            myTable = document.getElementById("incSupportTable");
        } else {
            myTable = document.getElementById("incAttackTable");
        }
        const thingsToShow = [...Object.keys(incUnits)];
        if (showHaulCapacity) {
            thingsToShow.push('haul');
        }
        thingsToShow.forEach((key) => {
            const elms = myTable.getElementsByClassName("unit-item-" + key)[0];
            if (elms) {
                elms.innerText = incUnits[key];
                if (incUnits[key] > 0) {
                    elms.classList.remove("hidden");
                }
            }
        });
    }

})(`<h4>Gelen Destek</h4><span id="supportText"></span>
<table id="incSupportTable" style="margin-bottom: 10px" class="vis" width="100%">
    <tbody>
        <tr>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="spear"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_spear.png" title="Mizrakci" alt="" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="sword"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_sword.png" title="Kilic Ustasi" alt="" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="axe"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_axe.png" title="Baltaci" alt="" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="archer"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_archer.png" title="Okcu" alt="" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="spy"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_spy.png" title="Casus" alt="" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="light"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_light.png" title="Hafif Atli" alt="" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="marcher"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_marcher.png" title="Okcu Atli" alt="" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="heavy"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_heavy.png" title="Agir Atli" alt="" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="ram"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_ram.png" title="Ram" alt="Sahmerdan" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="catapult"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_catapult.png" title="Mancilik" alt="" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="knight"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_knight.png" title="Sovalye" alt="" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="snob"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_snob.png" title="Misyoner" alt="" class=""></a>
            </th>
        </tr>
        <tr id="unitAmnt">
            <td class="unit-item unit-item-spear hidden">0</td>
            <td class="unit-item unit-item-sword hidden">0</td>
            <td class="unit-item unit-item-axe hidden">0</td>
            <td class="unit-item unit-item-archer hidden">0</td>
            <td class="unit-item unit-item-spy hidden">0</td>
            <td class="unit-item unit-item-light hidden">0</td>
            <td class="unit-item unit-item-marcher hidden">0</td>
            <td class="unit-item unit-item-heavy hidden">0</td>
            <td class="unit-item unit-item-ram hidden">0</td>
            <td class="unit-item unit-item-catapult hidden">0</td>
            <td class="unit-item unit-item-knight hidden">0</td>
            <td class="unit-item unit-item-snob hidden">0</td>
        </tr>
    </tbody>
</table>
<h4>Gelen Saldiri</h4><span id="attackText"></span>
<table id="incAttackTable" style="margin-bottom: 10px" class="vis" width="100%">
    <tbody>
        <tr>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="spear"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_spear.png" title="Mizrakci" alt="Spear fighter" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="sword"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_sword.png" title="Kilic Ustasi" alt="Swordsman" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="axe"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_axe.png" title="Baltaci" alt="Axeman" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="archer"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_archer.png" title="Okcu" alt="Archer" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="spy"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_spy.png" title="Casus" alt="Scout" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="light"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_light.png" title="Hafif Atli" alt="Light Cavalry" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="marcher"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_marcher.png" title="Okcu Atli" alt="Mounted Archer" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="heavy"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_heavy.png" title="Agir Atli" alt="Heavy Cavalry" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="ram"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_ram.png" title="Sahmerdan" alt="" class="Ram"></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="catapult"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_catapult.png" title="Mancilik" alt="Catapult" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="knight"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_knight.png" title="Sovalye" alt="Paladin" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="snob"><img src="https://dsen.innogamescdn.com/asset/10d39b3d/graphic/unit/unit_snob.png" title="Misyoner" alt="Noble" class=""></a>
            </th>
            <th style="text-align:center" width="35">
                <a href="#" class="unit_link" data-unit="haul"><span class="icon header ressources" title="Tasima Kapasitesi"></span></a>
            </th>
        </tr>
        <tr id="unitAmnt">
            <td class="unit-item unit-item-spear hidden">0</td>
            <td class="unit-item unit-item-sword hidden">0</td>
            <td class="unit-item unit-item-axe hidden">0</td>
            <td class="unit-item unit-item-archer hidden">0</td>
            <td class="unit-item unit-item-spy hidden">0</td>
            <td class="unit-item unit-item-light hidden">0</td>
            <td class="unit-item unit-item-marcher hidden">0</td>
            <td class="unit-item unit-item-heavy hidden">0</td>
            <td class="unit-item unit-item-ram hidden">0</td>
            <td class="unit-item unit-item-catapult hidden">0</td>
            <td class="unit-item unit-item-knight hidden">0</td>
            <td class="unit-item unit-item-snob hidden">0</td>
            <td class="unit-item unit-item-haul hidden">0</td>
        </tr>
    </tbody>
</table>`);
