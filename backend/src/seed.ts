import { prisma } from "./db.js";

type SeedUser = {
  id: string;
  username: string;
  role: "girl" | "rider";
  name: string;
  age: number;
  city: string;
  bio: string;
  photos: string[];
};

const seedUsers: SeedUser[] = [
  {
    id: "seed-girl-1",
    username: "alina_ride",
    role: "girl",
    name: "Аліна",
    age: 24,
    city: "Київ",
    bio: "Люблю швидкість і вітер. Мрію прокотитися серпантином 🏍️",
    photos: ["https://picsum.photos/seed/alina/600/800"],
  },
  {
    id: "seed-girl-2",
    username: "kate_moto",
    role: "girl",
    name: "Катерина",
    age: 27,
    city: "Львів",
    bio: "Кава, заходи сонця і гарна компанія на двох колесах.",
    photos: ["https://picsum.photos/seed/kate/600/800"],
  },
  {
    id: "seed-girl-3",
    username: "vika_v",
    role: "girl",
    name: "Вікторія",
    age: 22,
    city: "Одеса",
    bio: "Хочу навчитися кататися і знайти наставника 😊",
    photos: ["https://picsum.photos/seed/vika/600/800"],
  },
  {
    id: "seed-rider-1",
    username: "max_rider",
    role: "rider",
    name: "Максим",
    age: 29,
    city: "Київ",
    bio: "Honda CB650R, стаж 6 років. Покатаю з вітерцем, але обережно.",
    photos: ["https://picsum.photos/seed/max/600/800"],
  },
  {
    id: "seed-rider-2",
    username: "denis_speed",
    role: "rider",
    name: "Денис",
    age: 33,
    city: "Харків",
    bio: "Yamaha MT-09. Знаю найкращі маршрути по області.",
    photos: ["https://picsum.photos/seed/denis/600/800"],
  },
  {
    id: "seed-rider-3",
    username: "art_moto",
    role: "rider",
    name: "Артем",
    age: 26,
    city: "Дніпро",
    bio: "Ducati Monster. Кава, дорога, музика — що ще треба?",
    photos: ["https://picsum.photos/seed/art/600/800"],
  },
];

async function main() {
  for (const u of seedUsers) {
    await prisma.user.upsert({
      where: { id: u.id },
      create: {
        id: u.id,
        username: u.username,
        role: u.role,
        name: u.name,
        age: u.age,
        city: u.city,
        bio: u.bio,
        photos: { create: u.photos.map((url, order) => ({ url, order })) },
      },
      update: {},
    });
  }
  console.log(`Seed готовий: ${seedUsers.length} тестових анкет.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
