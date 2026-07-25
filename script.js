// Yaylaköy Bal Website
// İlk sürüm JavaScript dosyası


// Sayfa hazır olduğunda çalışır
document.addEventListener("DOMContentLoaded", function () {

    console.log("Yaylaköy Bal sitesi hazır!");

});


// Ürün butonu
const productButton = document.querySelector("button");


if(productButton){

    productButton.addEventListener("click", function(){

        document
        .getElementById("urunler")
        .scrollIntoView({
            behavior:"smooth"
        });

    });

}
