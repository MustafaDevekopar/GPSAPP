

function navigateTo(page) {
    loadPage(page);
    window.history.pushState({ page: page }, "", `#${page}`);
    setActiveLink(page);
}

function loadPage(page) {
    fetch(`${page}.html`)
        .then(response => {
            if (!response.ok) throw new Error("الصفحة غير موجودة");
            return response.text();
        })
        .then(data => {
            document.getElementById("content").innerHTML = data;
            setActiveLink(page); // تحديث الزر النشط بعد تحميل الصفحة
        })
        .catch(error => {
            document.getElementById("content").innerHTML = `<p style="color:red;">⚠️ خطأ: ${error.message}</p>`;
        });
}

function setActiveLink(page) {
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active'); // إزالة الكلاس النشط من جميع الروابط
        if (link.getAttribute("onclick")?.includes(page)) {
            link.classList.add('active'); // إضافة الكلاس النشط للرابط الحالي
        }
    });
}

// تحديد الصفحة الحالية عند تحميل الموقع
document.addEventListener("DOMContentLoaded", function () {
    let page = window.location.hash.substring(1) || "home";
    loadPage(page);
    setActiveLink(page);
});
