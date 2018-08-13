"use strict";

let myDashboard;
let beers;
let beersServed = 0;
let lastIdCounted = 0;
let beerOfTheDay = {count:0, name:"N/A"};
let beerUsageMap = {};
let bartenderOfTheDay = {count:0, name:"N/A"};
let bartenderUsageMap = {};
let avgBeerPerCustomer = 0;
let avgTimeInQueue = 0;
let queueMap = {};
let totalTimeInQueue = 0;
let peopleInQueueSoFar = 0;

// GET DATA AND LOAD IT
document.addEventListener("DOMContentLoaded", getAllData);

function getAllData() {
    loadScript();
    getBeerData();
};

function loadScript() {
    let data = FooBar.getData(true);
    myDashboard = JSON.parse(data);

    //BEER OF THE DAY
    myDashboard.taps.forEach(tap => {
        if (!beerUsageMap[tap.id]) {
            beerUsageMap[tap.id] = {
                beer: tap.beer, 
                count: 0,
                level: tap.level
            }
        }

        beerUsageMap[tap.id].count += beerUsageMap[tap.id].level - tap.level;
        beerUsageMap[tap.id].level = tap.level;


    })

    Object.keys(beerUsageMap).forEach(id => {
        if (beerUsageMap[id].count > beerOfTheDay.count) {
            beerOfTheDay.name = beerUsageMap[id].beer;
            beerOfTheDay.count = beerUsageMap[id].count;
        }
    })

    //BARTENDER OF THE DAY
    myDashboard.bartenders.forEach(bartender => {
        if (!bartenderUsageMap[bartender.name]) {
            bartenderUsageMap[bartender.name] = {
                name: bartender.name, 
                count: 0,
                statusDetail: null
            }
        }

        if (bartenderUsageMap[bartender.name].statusDetail != bartender.statusDetail && bartender.statusDetail == "receivePayment") {
            bartenderUsageMap[bartender.name].count++;
        }

        bartenderUsageMap[bartender.name].statusDetail = bartender.statusDetail;
    })

    Object.keys(bartenderUsageMap).forEach(name => {
        if (bartenderUsageMap[name].count > bartenderOfTheDay.count) {
            bartenderOfTheDay.name = bartenderUsageMap[name].name;
            bartenderOfTheDay.count = bartenderUsageMap[name].count;
        }
    })

    myDashboard.serving.forEach(customer => {
        if (customer.id > lastIdCounted) {
            beersServed += customer.order.length;
            lastIdCounted = customer.id;
        };
    });

    //AVERAGE BEER PER CUSTOMER
    avgBeerPerCustomer = Math.floor(beersServed / lastIdCounted);
    avgBeerPerCustomer = avgBeerPerCustomer ? avgBeerPerCustomer:0;

    //AVERAGE TIME IN QUEUE
    Object.keys(queueMap).forEach(id => {
        queueMap[id].inLine = false;
    })

    myDashboard.queue.forEach(q => {
        if (!queueMap[q.id]) {
            queueMap[q.id] = {
                startTime: q.startTime,
                inLine: true
            }
        }
        queueMap[q.id].inLine = true;
    })
    
    Object.keys(queueMap).forEach(id => {
        if (!queueMap[id].inLine) {
            queueMap[id].endTime = Date.now();
            totalTimeInQueue += queueMap[id].endTime - queueMap[id].startTime;
            peopleInQueueSoFar ++;
            delete queueMap[id];
        }
    })
    
    avgTimeInQueue = Math.floor(totalTimeInQueue / peopleInQueueSoFar); 
    avgTimeInQueue = avgTimeInQueue ? Math.floor(avgTimeInQueue / 1000):0;

    // DISPLAY CUSTOMERS IN QUEUE & CUSTOMERS BEING SERVED
    document.querySelector('#customersInQueue').textContent = `${myDashboard.queue.length}`;
    document.querySelector('#customersBeingServed').textContent = `${myDashboard.serving.length}`;

    // DISPLAY TOTAL BEERS SERVED
    document.querySelector('#totalBeersServed').textContent = `${beersServed}`;

    //DISPLAY TOTAL CUSTOMERS SERVED
    document.querySelector(`#totalCustomers`).textContent = `${lastIdCounted}`;

    //DISPLAY BEER OF THE DAY
    document.querySelector(`#beerOfTheDay`).textContent = `${beerOfTheDay.name}`;

    //DISPLAY BARTENDER OF THE DAY
    document.querySelector(`#bartenderOfTheDay`).textContent = `${bartenderOfTheDay.name}`;

    //DISPLAY AVERAGE BEER PER CUSTOMER
    document.querySelector(`#averageBeerPerCustomer`).textContent = `${avgBeerPerCustomer}`;

    //DISPLAY AVERAGE TIME IN QUEUE
    document.querySelector(`#averageTimeInQueue`).textContent = `${avgTimeInQueue}sec`;

    bartendersInformation();
    showTapsStatus();
}

function bartendersInformation() {
    //EMPTY THE CONTAINER
    document.querySelector(`.bartenders`).innerHTML = ``;

    let bartenders = myDashboard.bartenders;

    bartenders.forEach(bartenders => {
        //DEFINE THE TEMPLATE
        let bartendersTemplate = document.querySelector('.bartendersTemplate').content;
        //DEFINE THE CLONE
        let bartendersClone = bartendersTemplate.cloneNode(true);
        //DISPLAY NAME 
        bartendersClone.querySelector('.bartendersName').textContent = `${bartenders.name}`;
        //DISPLAY STATUS
        bartendersClone.querySelector('.bartendersStatus').textContent = `${bartenders.status}`;
        //DISPLAY STATUS DETAIL 
        bartendersClone.querySelector('.statusDetail').textContent = `${bartenders.statusDetail}`;

        //BARTENDERS ACTIVITY
        if (bartenders.statusDetail === "pourBeer") {
            bartendersClone.querySelector(".statusDetail").textContent = `is pouring beer`;
        } else if (bartenders.statusDetail === "reserveTap") {
            bartendersClone.querySelector(".statusDetail").textContent = `reserving tap`;
        } else if (bartenders.statusDetail === "startServing") {
            bartendersClone.querySelector(".statusDetail").textContent = `starts serving`;
        } else if (bartenders.statusDetail === "receivePayment") {
            bartendersClone.querySelector(".statusDetail").textContent = `receiveing payment`;
        } else if (bartenders.statusDetail === "releaseTap") {
            bartendersClone.querySelector(".statusDetail").textContent = `releasing tap`;
        } else {
            bartendersClone.querySelector(".statusDetail").textContent = `is waiting`;
        }

        document.querySelector(".bartenders").appendChild(bartendersClone);
    });
};

//TAPS LEVELS
function showTapsStatus() {
    //CLEAN THE CONTAINER
    document.querySelector(".tapsStatus").innerHTML = "";

    let taps = myDashboard.taps;

    taps.forEach(tap => {

        //DEFINE THE TEMPLATE
        let tapTemplate = document.querySelector('.tapsStatusTemplate').content;
        //DEFINE THE CLONE
        let clone = tapTemplate.cloneNode(true);
        //VALUE OF LEVELES TO HEIGHT LEVELS
        clone.querySelector('.tapsLevel').style.height = `${tap.level/10}px`;
        //BEER NAME
        clone.querySelector('.beer-tap-name').textContent = tap.beer;   
        //APPENDING CLONE TO DIV
        document.querySelector(".tapsStatus").appendChild(clone);
    });
};

// BEER INFO
function getBeerData() {
    let data = FooBar.getData();
    beers = JSON.parse(data).beertypes;

    beerInfo();
};

function beerInfo() {
    // CLEAN CONTAINER
    document.querySelector(".beerInfo").innerHTML = "";

    beers.forEach(beer => {
        //DEFINE THE TEMPLATE
        let beersTemplate = document.querySelector('.beerTemplate').content;
        //DEFINE THE CLONE
        let beerClone = beersTemplate.cloneNode(true);
        //DISPLAY LABEL, NAME, CATEGORY,OVERALL IMPRESSION, ALC%
        beerClone.querySelector('.beerLabel').src = `images/${beer.label}`;
        beerClone.querySelector('.beerName').textContent = `${beer.name}`;
        beerClone.querySelector('.beerCategory').textContent = `${beer.category}`;
        beerClone.querySelector(".modalDescription").textContent = `${beer.description.overallImpression}`;
        beerClone.querySelector(".modalAlcohol").textContent = `${beer.alc}% alc`;

        let button = beerClone.querySelector('.moreInfo');
        let modal = beerClone.querySelector(".modalContent");

        button.addEventListener("click", function () {
            modal.classList.toggle("hide");
        })

        // BEER MODAL
        //DISPLAY AROMA, APPEARANCE, FLAVOUR, FEEL
        beerClone.querySelector(".modalAroma").textContent = `${beer.description.aroma}`;
        beerClone.querySelector(".modalAppearance").textContent = `${beer.description.appearance}`;
        beerClone.querySelector(".modalFlavor").textContent = `${beer.description.flavor}`;
        beerClone.querySelector(".modalMouthFeel").textContent = `${beer.description.mouthfeel}`;

        //APPENDING CLONE TO DIV
        document.querySelector(".beerInfo").appendChild(beerClone);
    });
};

setInterval(function () {
    loadScript();
}, 1000);