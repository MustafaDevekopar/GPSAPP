
// تعريف المتغيرات العامة
let map, marker, polyline;
let locations = [];

// دالة تهيئة الخريطة
function initMap(lat, lon) {
    map = L.map('map').setView([lat, lon], 15);
    marker = L.marker([lat, lon]).addTo(map);
    polyline = L.polyline([], { color: 'blue' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
    }).addTo(map);
}

// التحقق من دعم Geolocation
if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(function (position) {
         const userLat = position.coords.latitude;
         const userLon = position.coords.longitude;
         initMap(userLat, userLon); // استخدام الموقع الفعلي للمستخدم
    }, function (error) {
         console.error("خطأ في الحصول على الموقع:", error);
         // في حالة الخطأ، استخدام إحداثيات افتراضية
         initMap(33.475712, 43.418453);
    });
} else {
    alert("الميزة غير مدعومة في متصفحك. سيتم استخدام الموقع الافتراضي.");
    initMap(33.42710474668382, 43.31028170080997);
}

// باقي الكود يبقى كما هو...
function toggleMenu() {
    document.querySelector(".nav-links").classList.toggle("show");
}

let socket;
let reconnectInterval = 5000; // مدة إعادة المحاولة (5 ثوانٍ)
let pingInterval;

document.addEventListener("DOMContentLoaded", function () {
    let storedIP = localStorage.getItem("esp8266_ip");
    if (storedIP) {
        document.getElementById("esp-ip").value = storedIP;
    }
});

function saveIP() {
    let ip = document.getElementById("esp-ip").value.trim();
    if (ip) {
        localStorage.setItem("esp8266_ip", ip);
        alert("تم حفظ عنوان الـ IP بنجاح!");
    } else {
        alert("يرجى إدخال عنوان IP صالح!");
    }
}

function connectWebSocket() {
    let ip = localStorage.getItem("esp8266_ip");
    if (!ip) {
        alert("يرجى إدخال عنوان الـ IP أولاً ثم الضغط على 'حفظ IP'");
        return;
    }

    let wsUrl = `ws://${ip}:81`;
    socket = new WebSocket(wsUrl);

    socket.onopen = function () {
        document.getElementById("data").innerText = "WebSocket متصل عبر " + wsUrl;
        console.log("Connected to WebSocket");

        // إرسال PING كل 30 ثانية للحفاظ على الاتصال نشطًا
        clearInterval(pingInterval);
        pingInterval = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send("PING");
                console.log("Sent PING to keep connection alive");
            }
        }, 30000);
    };

    socket.onmessage = function (event) {
        let gpsData = event.data;
        let coordinates = extractGPS(gpsData);
        if (coordinates) {
            updateMap(coordinates);
            displayLocations(coordinates);
        }
    };

    socket.onerror = function (error) {
        console.error("Error: " + error);
        // alert("حدث خطأ في الاتصال، سيتم إعادة المحاولة خلال 5 ثوانٍ...");
        reconnectWebSocket();
    };

    socket.onclose = function () {
        console.log("Connection closed, reconnecting...");
        document.getElementById("data").innerText = "تم قطع الاتصال، جاري إعادة الاتصال...";
        reconnectWebSocket();
    };
}

function reconnectWebSocket() {
    clearInterval(pingInterval);
    setTimeout(connectWebSocket, reconnectInterval);
}

function extractGPS(data) {
    let regex = /AT\+SEND=\d+,\d+,([\d.]+),([\d.]+)\|/;
    let match = data.match(regex);
    if (match) {
        let lat = parseFloat(match[1]);
        let lon = parseFloat(match[2]);
        if (isValidCoordinate(lat, lon)) {
            return `${lat},${lon}`;
        } else {
            console.warn("تم تجاهل البيانات غير الصحيحة:", data);
        }
    }
    return null;
}

function isValidCoordinate(lat, lon) {
    const latMin = 33.47, latMax = 33.48;
    const lonMin = 43.41, lonMax = 43.42;
    return lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax;
}

function updateMap(gpsData) {
    let coords = gpsData.split(",");
    let lat = parseFloat(coords[0]);
    let lon = parseFloat(coords[1]);

    if (!isNaN(lat) && !isNaN(lon)) {
        map.setView([lat, lon], 15);
        marker.setLatLng([lat, lon]);
        locations.push([lat, lon]);
        polyline.setLatLngs(locations);
    }
}

function displayLocations(gpsData) {
    let dataElement = document.getElementById("data");
    let newLocationDiv = document.createElement("div");
    newLocationDiv.textContent = gpsData;
    newLocationDiv.style.padding = "5px";
    newLocationDiv.style.borderBottom = "1px solid #ccc";
    newLocationDiv.style.backgroundColor = "#007bff5b";
    dataElement.appendChild(newLocationDiv);
    setTimeout(() => {
        newLocationDiv.style.backgroundColor = "";
    }, 500);
    dataElement.scrollTop = dataElement.scrollHeight;
}

// بدء الاتصال عند تحميل الصفحة
connectWebSocket();
