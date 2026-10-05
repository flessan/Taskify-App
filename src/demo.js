const mobil = {
    merek: "Toyota", // property value
    tahun: 2020,
    tipe: "SUV",
    harga: 300_000_000,
}

console.log(mobil)

const laptop = {
    tipe: "MacBook Pro",
    warna: "Silver",
    ram: "16GB",
    cpu: "M1 Pro",
    gpu: "M1 Pro",
    ssd: "1TB",
    os: "macOS",
    layar: "16 inch",
    baterai: "10000mAh",
}


const {os, baterai} = laptop

console.log(os)
console.log(baterai)

const names = ["Akhmad", "Daus", "Hafiz", "Thio", "Sidi"];

console.log(names)

// // Imperative programming
// for (let i = 0; i < names.length; i++) {
//     console.log(names[i])
// }

// Declarative programming
// names.forEach(name => console.log(name))
console.log(
    names.map(name => name.toUpperCase())
)

const nilaiUts = [80, 90, 70, 60, 85]

console.log(
    nilaiUts.filter(nilai => nilai >= 85)
)