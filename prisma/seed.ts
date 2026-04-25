import { EventCategory } from "../src/generated/prisma/enums";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Заполнение базы данных...");

  const events = [
    // MУЗЫКАЛЬНЫЕ СОБЫТИЯ
    {
      name: 'Рок-концерт "Гром"',
      description:
        "Выступление лучших рок-групп города. Грандиозное шоу с пиротехникой и спецэффектами.",
      images: [],
      date: new Date("2024-06-15T19:00:00Z"),
      address: 'Москва, Стадион "Лужники", ул. Лужники, 24',
      latitude: 55.7155,
      longitude: 37.5531,
      price: 2500,
      minAge: 16,
      maxAge: 60,
      categories: ["MUSIC"] as EventCategory[],
      blocks: [
        {
          title: "Что взять",
          content: "Паспорт, наушники, хорошее настроение",
          order: 1,
        },
        {
          title: "Правила",
          content: "Запрещено проносить оружие и алкоголь",
          order: 2,
        },
      ],
    },
    {
      name: "Джазовый вечер",
      description:
        "Вечер классического джаза в уютном ресторане. Живая музыка, свечи, романтическая атмосфера.",
      images: [],
      date: new Date("2024-07-20T20:00:00Z"),
      address: 'Санкт-Петербург, Джаз-клуб "36", Невский пр., 36',
      latitude: 59.9343,
      longitude: 30.3351,
      price: 1800,
      minAge: 18,
      maxAge: 80,
      categories: ["MUSIC"] as EventCategory[],
      blocks: [],
    },
    {
      name: "Электронный фестиваль",
      description:
        "Масштабный фестиваль электронной музыки с известными диджеями.",
      images: [],
      date: new Date("2024-08-10T14:00:00Z"),
      address: 'Казань, Экстрим-парк "Урам", ул. Поддубная, 2',
      latitude: 55.7963,
      longitude: 49.1088,
      price: 3500,
      minAge: 18,
      maxAge: 45,
      categories: ["MUSIC", "DANCE"] as EventCategory[],
      blocks: [],
    },

    // СПОРТИВНЫЕ СОБЫТИЯ
    {
      name: 'Марафон "Бегущие сердца"',
      description:
        "Благотворительный марафон в поддержку детей с болезнями сердца. Дистанции: 5км, 10км, 21км.",
      images: [],
      date: new Date("2024-09-05T09:00:00Z"),
      address: "Екатеринбург, Центральный парк, ул. Мира, 2",
      latitude: 56.8389,
      longitude: 60.6057,
      price: 500,
      minAge: 12,
      maxAge: 70,
      categories: ["SPORT"] as EventCategory[],
      blocks: [
        {
          title: "Необходимое снаряжение",
          content: "Спортивная форма, бутылка воды, нагрудный номер",
          order: 1,
        },
      ],
    },
    {
      name: "Турнир по пляжному волейболу",
      description:
        "Летний турнир среди любительских команд. Призы для победителей.",
      images: [],
      date: new Date("2024-07-28T10:00:00Z"),
      address: 'Сочи, Пляж "Ривьера", ул. Виноградная, 33',
      latitude: 43.5855,
      longitude: 39.7231,
      price: 300,
      minAge: 14,
      maxAge: 50,
      categories: ["SPORT", "NATURE"] as EventCategory[],
      blocks: [],
    },

    // КНИЖНЫЕ СОБЫТИЯ
    {
      name: "Книжная ярмарка",
      description:
        "Ежегодная книжная ярмарка с автограф-сессиями и лекциями писателей.",
      images: [],
      date: new Date("2024-10-12T11:00:00Z"),
      address: "Москва, ЦДХ, Крымский Вал, 10",
      latitude: 55.7354,
      longitude: 37.6056,
      price: 200,
      minAge: 0,
      maxAge: 100,
      categories: ["BOOKS"] as EventCategory[],
      blocks: [],
    },
    {
      name: 'Литературный клуб "Читатели"',
      description:
        "Обсуждение современных книг за чашкой кофе. Встреча для любителей хорошей литературы.",
      images: [],
      date: new Date("2024-06-25T18:30:00Z"),
      address: 'Новосибирск, Кафе "Книги и кофе", Красный пр., 15',
      latitude: 55.0302,
      longitude: 82.9204,
      price: 150,
      minAge: 16,
      maxAge: 100,
      categories: ["BOOKS", "TALKS"] as EventCategory[],
      blocks: [],
    },

    // ТАНЦЕВАЛЬНЫЕ СОБЫТИЯ
    {
      name: "Мастер-класс по сальсе",
      description: "Обучение сальсе с нуля. Преподаватель из Кубы.",
      images: [],
      date: new Date("2024-07-05T19:00:00Z"),
      address:
        'ростов-на-Дону, Танцевальная студия "Salsa Loca", пр. Чехова, 60',
      latitude: 47.2221,
      longitude: 39.7204,
      price: 800,
      minAge: 16,
      maxAge: 60,
      categories: ["DANCE"] as EventCategory[],
      blocks: [
        {
          title: "Что надеть",
          content: "Удобная обувь, сменная футболка",
          order: 1,
        },
      ],
    },
    {
      name: "Хип-хоп баттл",
      description: "Ежегодный чемпионат по хип-хопу. Призовой фонд 100 000₽.",
      images: [],
      date: new Date("2024-08-25T15:00:00Z"),
      address: 'Нижний Новгород, Клуб "Energy", ул. Б. Покровская, 18',
      latitude: 56.3287,
      longitude: 44.002,
      price: 500,
      minAge: 14,
      maxAge: 35,
      categories: ["DANCE", "SPORT"] as EventCategory[],
      blocks: [],
    },

    // ИГРОВЫЕ СОБЫТИЯ
    {
      name: "Турнир по настольным играм",
      description:
        "Вечер настольных игр: Мафия, Имаджинариум, Экивоки. Призы и подарки.",
      images: [],
      date: new Date("2024-06-30T17:00:00Z"),
      address: 'Красноярск, Антикафе "Территория", ул. Ленина, 85',
      latitude: 56.0106,
      longitude: 92.8526,
      price: 350,
      minAge: 12,
      maxAge: 45,
      categories: ["GAMES"] as EventCategory[],
      blocks: [],
    },
    {
      name: "Киберспортивный турнир Dota 2",
      description:
        "Любительский турнир по Dota 2. Призы для победителей - 50 000₽.",
      images: [],
      date: new Date("2024-09-15T12:00:00Z"),
      address:
        'Санкт-Петербург, Киберспортивная арена "Coliseum", ул. Савушкина, 141',
      latitude: 59.9864,
      longitude: 30.2375,
      price: 600,
      minAge: 16,
      maxAge: 35,
      categories: ["GAMES"] as EventCategory[],
      blocks: [],
    },

    // ПРИРОДНЫЕ СОБЫТИЯ
    {
      name: "Поход в горы",
      description:
        "Выходные в горах с палатками. Костер, гитара, красивые виды.",
      images: [],
      date: new Date("2024-08-03T08:00:00Z"),
      address: 'Красная Поляна, турбаза "Горная", ул. Заповедная, 5',
      latitude: 43.6791,
      longitude: 40.2051,
      price: 1500,
      minAge: 18,
      maxAge: 50,
      categories: ["NATURE", "SPORT"] as EventCategory[],
      blocks: [
        {
          title: "Необходимое снаряжение",
          content: "Палатка, спальник, удобная обувь, дождевик",
          order: 1,
        },
        {
          title: "Правила безопасности",
          content: "Не уходить от группы, соблюдать технику безопасности",
          order: 2,
        },
      ],
    },
    {
      name: "Экскурсия по ботаническому саду",
      description:
        "Прогулка по ботаническому саду с гидом. Рассказ о редких растениях.",
      images: [],
      date: new Date("2024-07-12T10:00:00Z"),
      address: "Воронеж, Ботанический сад, ул. Ломоносова, 85",
      latitude: 51.6554,
      longitude: 39.2053,
      price: 300,
      minAge: 0,
      maxAge: 100,
      categories: ["NATURE", "TALKS"] as EventCategory[],
      blocks: [],
    },

    {
      name: "Экскурсия по старому городу",
      description:
        "Пешеходная экскурсия по историческому центру. Длительность 2 часа.",
      images: [],
      date: new Date("2024-07-18T11:00:00Z"),
      address: "Казань, ул. Баумана, 10",
      latitude: 55.7955,
      longitude: 49.1089,
      price: 500,
      minAge: 6,
      maxAge: 80,
      categories: ["TRAVEL"] as EventCategory[],
      blocks: [],
    },
    {
      name: "Велотур по набережной",
      description:
        "Совместная велопрогулка по набережной. Аренда велосипедов включена.",
      images: [],
      date: new Date("2024-08-08T18:00:00Z"),
      address: "Самара, набережная, спуск к Волге, 1",
      latitude: 53.1865,
      longitude: 50.1037,
      price: 700,
      minAge: 14,
      maxAge: 55,
      categories: ["TRAVEL", "SPORT"] as EventCategory[],
      blocks: [],
    },

    // БЕСПЛАТНЫЕ СОБЫТИЯ
    {
      name: "Лекция об искусственном интеллекте",
      description: "Открытая лекция о будущем ИИ. Вход свободный.",
      images: [],
      date: new Date("2024-07-25T19:00:00Z"),
      address: "Томск, ТГУ, пр. Ленина, 36",
      latitude: 56.466,
      longitude: 84.9489,
      price: 0,
      minAge: 14,
      maxAge: 100,
      categories: ["TALKS"] as EventCategory[],
      blocks: [],
    },
    {
      name: "Йога в парке",
      description:
        "Утренняя йога на свежем воздухе. Бесплатно для всех желающих.",
      images: [],
      date: new Date("2024-07-07T09:00:00Z"),
      address: "Уфа, Парк им. Якутова, ул. Комсомольская, 112",
      latitude: 54.7348,
      longitude: 55.9579,
      price: 0,
      minAge: 12,
      maxAge: 70,
      categories: ["SPORT", "NATURE"] as EventCategory[],
      blocks: [],
    },

    // ПРОШЛЫЕ СОБЫТИЯ (не актуальны)
    {
      name: "Выставка современного искусства",
      description:
        "Выставка картин молодых художников. Мероприятие уже прошло.",
      images: [],
      date: new Date("2024-01-15T14:00:00Z"),
      address: 'Москва, Галерея "Триумф", ул. Ильинка, 4',
      latitude: 55.7536,
      longitude: 37.6213,
      price: 400,
      minAge: 12,
      maxAge: 90,
      categories: ["TALKS"] as EventCategory[],
      blocks: [],
    },
    {
      name: "Новогодняя ярмарка",
      description: "Предновогодняя ярмарка с подарками и развлечениями.",
      images: [],
      date: new Date("2023-12-20T12:00:00Z"),
      address: "Челябинск, Площадь Революции, 1",
      latitude: 55.1598,
      longitude: 61.4026,
      price: 0,
      minAge: 0,
      maxAge: 100,
      categories: ["GAMES"] as EventCategory[],
      blocks: [],
    },
  ];

  for (const event of events) {
    await prisma.event.create({
      data: {
        ...event,
        ownerId: "cmoenh0fs00002wu8561neyq2",
      },
    });
  }

  console.log(`Создано ${events.length} мероприятий`);
}

main()
  .catch((e) => {
    console.error("Ошибка:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
