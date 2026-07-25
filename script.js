// Yaylaköy Bal Website


document.addEventListener("DOMContentLoaded", function () {

    console.log("Yaylaköy Bal sitesi hazır!");


    // Ürünleri yükle

    fetch("assets/products.json")

    .then(response => response.json())

    .then(products => {


        const productList = document.getElementById("product-list");


        products.forEach(product => {


            const card = document.createElement("article");


            card.innerHTML = `

                <img src="${product.image}" 
                alt="${product.name}"
                width="200">


                <h3>
                ${product.name}
                </h3>


                <p>
                ${product.description}
                </p>


                <strong>
                ${product.price}
                </strong>


                <p>
                ${product.weight}
                </p>

            `;


            productList.appendChild(card);


        });


    })

    .catch(error => {

        console.log("Ürünler yüklenemedi:", error);

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


});
