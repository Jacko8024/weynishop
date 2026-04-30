function toggleLanguage() {
  const am = document.querySelectorAll('[id$="-am"]');
  const en = document.querySelectorAll('[id$="-en"]');
  am.forEach((el) => el.classList.toggle("hidden"));
  en.forEach((el) => el.classList.toggle("hidden"));
}

// Track currently selected category
function filterCategory(category, btn) {
  let cards = document.querySelectorAll(".card");
  cards.forEach(function (card) {
    if (category === "all" || card.dataset.category === category) {
      card.style.display = "";
    } else {
      card.style.display = "none";
    }
  });

  // Update active button highlight
  if (btn) {
    document.querySelectorAll(".category-container button").forEach(function (b) {
      b.classList.remove("active");
    });
    btn.classList.add("active");
  }
}

 



function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  showSlide(currentSlide);
}

//yelbsochen color,  kefit & kehala


 

//order whtsapp
function orderWhatsApp(product, colorId, sizeId) {
  let color = document.getElementById(colorId).value;
  let size = document.getElementById(sizeId).value;

  let message = `Hello, I want to order:

Product: ${product}
Color: ${color}
Size: ${size}

From Weynushop`;

  let phone = "961XXXXXXXX"; // merchant phone

  let url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  window.open(url);
}

//Telegram Order Message
function orderTelegram(product, colorId, sizeId) {
  let color = document.getElementById(colorId).value;
  let size = document.getElementById(sizeId).value;

  let message = `Hello, I want to order:

Product: ${product}
Color: ${color}
Size: ${size}

From Weynushop`;

  let username = "merchantusername";

  let url = `https://t.me/${username}?text=${encodeURIComponent(message)}`;

  window.open(url);
}

// color meqeyayeriya
let currentColor = "red";
let currentSide = "front";

function changeColor(color) {
  currentColor = color;

  document.getElementById("shirt1").src =
    "img/shirt-" + color + "-" + currentSide + ".jpg";
}

function showFront() {
  currentSide = "front";

  document.getElementById("shirt1").src =
    "img/shirt-" + currentColor + "-front.jpg";
}

function showBack() {
  currentSide = "back";

  document.getElementById("shirt1").src =
    "img/shirt-" + currentColor + "-back.jpg";
}

//be serch ye and suqe balebet eqawochen and bota lemgegt

function searchStore() {
  let input = document.getElementById("searchInput").value.toLowerCase();

  let cards = document.querySelectorAll(".card");

  cards.forEach(function (card) {
    let storeName = card.querySelector("h3").textContent.toLowerCase();

    if (storeName.includes(input)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

// dynamic whatsapp and telegram message generator
document.addEventListener("DOMContentLoaded", function() {
    const cards = document.querySelectorAll('.product-card, .card');
    
    // Generate a prefix based on the filename (e.g. "zeha.html" -> "ZEH")
    let path = window.location.pathname;
    let fileName = path.split('/').pop().replace('.html', '');
    if (!fileName || fileName === "index") {
        fileName = document.title.split('|')[0].trim();
    }
    // Handle Amharic titles by taking the first word up to 4 chars
    let prefix = fileName.replace(/[^a-zA-Zአ-ፐ]/g, '').substring(0, 4).toUpperCase();
    if (!prefix) prefix = "ITEM";
    
    cards.forEach((card, index) => {
        let productNameElement = card.querySelector('h3');
        let imageElement = card.querySelector('img');
        
        let productName = productNameElement ? productNameElement.innerText.trim() : "";
        if (!productName) {
            productName = "ምርት / ልብስ";
        }
        
        // Generate a stable code for the item
        let itemIndex = (index + 1).toString().padStart(2, '0');
        let itemCode = `${prefix}-${itemIndex}`;
        
        let rawMessage = "ሰላም! ይህንን መግዛት እፈልጋለሁ፡ " + productName;
        rawMessage += "\nየእቃው ኮድ (Item Code): " + itemCode;
        
        let waBtn = card.querySelector('.whatsapp');
        if (waBtn) {
            try {
                let urlObj = new URL(waBtn.href);
                urlObj.searchParams.set("text", rawMessage);
                waBtn.href = urlObj.toString();
            } catch(e) {}
        }
        
        let tgBtn = card.querySelector('.telegram');
        if (tgBtn) {
            try {
                let tgUrl = new URL(tgBtn.href);
                tgUrl.searchParams.set("text", rawMessage);
                tgBtn.href = tgUrl.toString();
            } catch(e) {}
        }
    });
});

// Cargo image upload handler
function loadCargoImage(event, input) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  var placeholder = input.nextElementSibling;
  reader.onload = function(e) {
    placeholder.innerHTML = '<img src="' + e.target.result + '" alt="Cargo">';
  };
  reader.readAsDataURL(file);
}

