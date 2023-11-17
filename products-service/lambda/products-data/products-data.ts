export interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
}

export const products: Product[] = [
  {
    id: "1",
    title: "One Piece",
    description: "Adventure manga by Eiichiro Oda",
    price: 12.99,
  },
  {
    id: "2",
    title: "Naruto",
    description: "Ninja-themed manga by Masashi Kishimoto",
    price: 10.99,
  },
  {
    id: "3",
    title: "Attack on Titan",
    description: "Dark fantasy manga by Hajime Isayama",
    price: 14.99,
  },
  {
    id: "4",
    title: "Death Note",
    description: "Psychological thriller by Tsugumi Ohba",
    price: 9.99,
  },
  {
    id: "5",
    title: "My Hero Academia",
    description: "Superhero manga by Kohei Horikoshi",
    price: 15.99,
  },
  {
    id: "6",
    title: "Fullmetal Alchemist",
    description: "Adventure manga by Hiromu Arakawa",
    price: 18.99,
  },
  {
    id: "7",
    title: "One Punch Man",
    description: "Action-comedy manga by ONE",
    price: 11.99,
  },
  {
    id: "8",
    title: "Demon Slayer: Kimetsu no Yaiba",
    description: "Supernatural action manga by Koyoharu Gotouge",
    price: 16.99,
  },
  {
    id: "9",
    title: "Tokyo Ghoul",
    description: "Dark fantasy manga by Sui Ishida",
    price: 13.99,
  },
  {
    id: "10",
    title: "Hunter x Hunter",
    description: "Adventure manga by Yoshihiro Togashi",
    price: 17.99,
  },
  {
    id: "11",
    title: "Berzerk",
    description: "Dark fantasy manga by Kentaro Miura",
    price: 19.99,
  },
  {
    id: "12",
    title: "Vagabond",
    description: "Adventure manga by Takehiko Inoue",
    price: 20.99,
  },
  {
    id: "13",
    title: "JoJo's Bizarre Adventure",
    description: "Adventure manga by Hirohiko Araki",
    price: 21.99,
  },
];
