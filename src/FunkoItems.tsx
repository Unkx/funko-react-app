// Define the type right here — no external file needed
export interface FunkoItem {
  id: string;
  title: string;
  number: string;
  category: string;
  series: string[];
  exclusive: boolean;
  imageName: string;
}

export const FunkoItems: FunkoItem[] = [
      // Funko TV Category - 10 items
      {
        id: "friends-rachel-green-01",
        title: "Rachel Green",
        number: "01",
        category: "Funko TV",
        series: ["Friends", "Sitcom"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/461860/Rachel_Green_Vinyl_Art_Toys_a0b0b9da-d3d9-4622-bee6-a9bb1ba3b5e5_large.jpg"
      },
      {
        id: "friends-monica-geller-02",
        title: "Monica Geller",
        number: "02",
        category: "Funko TV",
        series: ["Friends", "Sitcom"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/461861/Monica_Geller_Vinyl_Art_Toys_d8d37e61-4005-4aee-a7bd-598cded19bbc_large.jpg"
      },
      {
        id: "friends-chandler-bing-03",
        title: "Chandler Bing",
        number: "264",
        category: "Funko TV",
        series: ["Friends", "Sitcom"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/461863/Chandler_Bing_Vinyl_Art_Toys_4d5dcb52-9661-4687-b8df-42cd57238eed_large.jpg"
      },
      {
        id: "stranger-things-eleven-15",
        title: "Eleven",
        number: "15",
        category: "Funko TV",
        series: ["Stranger Things", "Sci-Fi"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/598719/Eleven_and_Demogorgon__Vinyl_Art_Toys_96c6e6fa-4823-4e6e-8799-d3d70ee356e4_large.jpeg"
      },
      {
        id: "stranger-things-joey-16",
        title: "Joey Wheeler", // ⚠️ Fixed: "Joey Wheeler" was incorrect
        number: "16",
        category: "Funko TV",
        series: ["Stranger Things", "Sci-Fi"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/814052/Joey_Wheeler_Vinyl_Art_Toys_24abc2c9-a800-48cf-8cec-c40862206724_large.JPG"
      },
      {
        id: "office-michael-scott-42",
        title: "Michael Scott",
        number: "42",
        category: "Funko TV",
        series: ["The Office", "Sitcom"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/837681/Michael_Scott_%2528Straight_Jacket%2529_Vinyl_Art_Toys_450935ba-d4f9-4c12-a1f4-cdf4f8c82bbc.jpg"
      },
      {
        id: "office-dwight-schrute-43",
        title: "Dwight Schrute",
        number: "43",
        category: "Funko TV",
        series: ["The Office", "Sitcom"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/762617/Dwight_Schrute_%2528CPR_Dummy_Mask%2529_Vinyl_Art_Toys_a954d32a-83d7-4ae0-acb2-389b8d0f3264_large.jpg"
      },
      {
        id: "game-of-thrones-daenerys-28",
        title: "Daenerys Targaryen",
        number: "28",
        category: "Funko TV",
        series: ["Game of Thrones", "Fantasy"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/473682/Daenerys_Targaryen_%2528Blue_Dress%2529_Action_Figures_1af6ce5e-4c79-4796-b2d2-af1f3944a07e_large.jpg"
      },
      {
        id: "game-of-thrones-jon-snow-29",
        title: "Jon Snow",
        number: "29",
        category: "Funko TV",
        series: ["Game of Thrones", "Fantasy"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/856650/Jon_Snow_Pins_and_Badges_eb9a8b21-6547-40a9-986f-6551629ba5df_large.jpg"
      },
      {
        id: "breaking-bad-walter-white-50",
        title: "Walter White",
        number: "50",
        category: "Funko TV",
        series: ["Breaking Bad", "Drama"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/474937/Walter_White_Shirts_and_Jackets_70d897a8-039d-4fc6-b5e8-3c594f22049c_large.jpg"
      },

      // Funko Movies Category - 10 items
      {
        id: "star-wars-darth-vader-01",
        title: "Darth Vader",
        number: "01",
        category: "Funko Movies",
        series: ["Star Wars", "Sci-Fi"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/853059/Darth_Maul_%2528The_Clone_Wars%2529_Vinyl_Art_Toys_1d24d0c9-9dcd-4f3a-baaa-f90a72276c80.jpg"
      },
      {
        id: "star-wars-luke-skywalker-02",
        title: "Luke Skywalker",
        number: "02",
        category: "Funko Movies",
        series: ["Star Wars", "Sci-Fi"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/879831/Luke_Skywalker_%2528Bespin%2529_Pins_and_Badges_08dc41d7-81c8-44af-b398-8e7851141f54_large.jpg"
      },
      {
        id: "star-wars-yoda-03",
        title: "Yoda",
        number: "03",
        category: "Funko Movies",
        series: ["Star Wars", "Sci-Fi"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/856113/Yoda_Pins_and_Badges_f7edca81-90b8-4374-b8e3-a3c90c83933b_large.jpg"
      },
      {
        id: "harry-potter-harry-15",
        title: "Harry Potter",
        number: "15",
        category: "Funko Movies",
        series: ["Harry Potter", "Fantasy"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/878867/Harry_Potter_%2528Snow_Globe%2529_Vinyl_Art_Toys_55febef4-8c7c-4de1-b997-60be7c2c164c_large.JPG"
      },
      {
        id: "harry-potter-hermione-16",
        title: "Hermione Granger",
        number: "16",
        category: "Funko Movies",
        series: ["Harry Potter", "Fantasy"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/788498/Hermione_with_Feather_Vinyl_Art_Toys_33d32aad-d32c-40d8-9145-291f48a221bb_large.JPG"
      },
      {
        id: "marvel-iron-man-42",
        title: "Iron Man",
        number: "42",
        category: "Funko Movies",
        series: ["Marvel", "Superheroes"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/816148/Iron_Man_Pens_19c08fca-976b-47a5-98d3-3128d2fb6ae2_large.JPG"
      },
      {
        id: "marvel-captain-america-43",
        title: "Captain America",
        number: "43",
        category: "Funko Movies",
        series: ["Marvel", "Superheroes"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/860713/Captain_America_Pins_and_Badges_184fc218-1733-4ef0-b7f8-21ec63fd97a5_large.jpg"
      },
      {
        id: "dc-batman-28",
        title: "Batman",
        number: "28",
        category: "Funko Movies",
        series: ["DC Comics", "Superheroes"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/889030/Batman_%2528Imperial_Palace%2529_Vinyl_Art_Toys_8440b82e-70b5-4444-a7a5-359e647983a0_large.JPG"
      },
      {
        id: "dc-superman-29",
        title: "Superman",
        number: "29",
        category: "Funko Movies",
        series: ["DC Comics", "Superheroes"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/885593/Superman_Comics_and_Graphic_Novels_fc5fa629-d5c5-4db9-9d84-ad6678be067f_large.jpg"
      },
      {
        id: "dc-wonder-woman-30",
        title: "Wonder Woman",
        number: "30",
        category: "Funko Movies",
        series: ["DC Comics", "Superheroes"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/861603/Wonder_Woman_Pins_and_Badges_c1804336-98fa-4334-950c-19bd81e62c28_large.jpg"
      },

      // Funko WWE Category - 10 items
      {
        id: "wwe-john-cena-01",
        title: "John Cena",
        number: "01",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/475730/John_Cena_Keychains_89aebc39-9fb0-44e7-b733-178b33a029b6_large.jpg"
      },
      {
        id: "wwe-the-rock-15",
        title: "The Rock",
        number: "15",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/750693/The_Rock_%2528Gold%2529_Vinyl_Art_Toys_9d2cc1d3-16ee-40f3-929f-c9570f687dc5_large.jpg"
      },
      {
        id: "wwe-stone-cold-42",
        title: "Stone Cold Steve Austin",
        number: "42",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/462009/Stone_Cold_Steve_Austin_%2528WWE_2K16%2529_Vinyl_Art_Toys_11a44535-e69f-4b27-92e5-e3672a82dcff_large.jpg"
      },
      {
        id: "wwe-undertaker-28",
        title: "The Undertaker",
        number: "28",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/885057/Undertaker_Vinyl_Art_Toys_c62c7527-f8b2-4e00-990d-48fb1cddc26d.JPG"
      },
      {
        id: "wwe-randy-orton-29",
        title: "Randy Orton",
        number: "29",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/707401/Randy_Orton_Vinyl_Art_Toys_25692853-1d6e-4744-9c22-4d4cafd1f2c1_large.jpg"
      },
      {
        id: "wwe-triple-h-30",
        title: "Triple H",
        number: "30",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/742491/Triple_H_Vinyl_Art_Toys_34a3c6c2-40c1-4d61-984e-7b6a86cb43e9_large.jpg"
      },
      {
        id: "wwe-shawn-michaels-31",
        title: "Shawn Michaels",
        number: "31",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/463495/Shawn_Michaels_Vinyl_Art_Toys_8488a74c-a49f-43f5-9f06-66433d02af3b_large.jpg"
      },
      {
        id: "wwe-bret-hart-32",
        title: "Bret Hart",
        number: "32",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/468297/Bret_Hart_Vinyl_Art_Toys_cfeab45a-ec7d-4541-aa35-040eeac6d765_large.jpg"
      },
      {
        id: "wwe-roman-reigns-33",
        title: "Roman Reigns",
        number: "33",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/468665/Roman_Reigns_Vinyl_Art_Toys_9f410eb4-e27c-4ff9-af4c-30e498fce9b1_large.jpg"
      },
      {
        id: "wwe-brock-lesnar-34",
        title: "Brock Lesnar",
        number: "34",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/582239/Brock_Lesnar_Shirts_and_Jackets_eeee949d-e965-48c4-aa4b-626fb19d2ce6_large.jpeg"
      },

      // Funko Games Category - 10 items
      {
        id: "fortnite-skull-trooper-01",
        title: "Skull Trooper",
        number: "01",
        category: "Funko Games",
        series: ["Fortnite", "Battle Royale"],
        exclusive: false,
        imageName: "https://i0.wp.com/prestige-life.com/wp-content/uploads/2022/04/fortnite-funko-Skull-Trooper-01.jpg?fit=1000%2C1000&ssl=1"
      },
      {
        id: "fortnite-gumbo",
        title: "Gumbo",
        number: "02",
        category: "Funko Games",
        series: ["Fortnite", "Battle Royale"],
        exclusive: true,
        imageName: "https://m.media-amazon.com/images/I/61CYjOH9h2L._AC_SL1300_.jpg"
      },
      {
        id: "overwatch-tracer-15",
        title: "Tracer",
        number: "15",
        category: "Funko Games",
        series: ["Overwatch", "FPS"],
        exclusive: false,
        imageName: "https://merchshark.dk/wp-content/uploads/2018/06/Tracer-figur-Funko-Pop-Overwatch.png"
      },
      {
        id: "overwatch-mercy-16",
        title: "Mercy",
        number: "16",
        category: "Funko Games",
        series: ["Overwatch", "FPS"],
        exclusive: false,
        imageName: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi5.walmartimages.com%2Fasr%2F57cf4a1f-1fca-4bd1-b669-911dbbc17b60.b4d4c604bc7f363ec5a5fe4c0b97f11b.jpeg%3FodnWidth%3D1000%26odnHeight%3D1000%26odnBg%3Dffffff&f=1&nofb=1&ipt=ff157846d24a9118680ad0dc63ae035ad8405f270b7ad7e240e66eb0e5be8279"
      },
      {
        id: "halo-master-chief-42",
        title: "Master Chief",
        number: "42",
        category: "Funko Games",
        series: ["Halo", "FPS"],
        exclusive: true,
        imageName: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fhttp2.mlstatic.com%2FD_NQ_NP_825103-MLU69453002223_052023-O.webp&f=1&nofb=1&ipt=06573952f51164a55a919b050190b5925762ffd7e60140cabe094c0c87ced739"
      },
      {
        id: "halo-cortana-43",
        title: "Cortana",
        number: "43",
        category: "Funko Games",
        series: ["Halo", "FPS"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/pf8AAOSwq~9iVKgd/s-l1600.jpg"
      },
      {
        id: "pokemon-pikachu-28",
        title: "Pikachu",
        number: "28",
        category: "Funko Games",
        series: ["Pokémon", "RPG"],
        exclusive: false,
        imageName: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fclickandrol.com%2F13534-thickbox_default%2Ffunko-pop-pokemon-pikachu-598.jpg&f=1&nofb=1&ipt=ee53bf5833b718320449dd417946539a4239998da9965010933d4c06443697c8"
      },
      {
        id: "pokemon-charizard-29",
        title: "Charizard",
        number: "29",
        category: "Funko Games",
        series: ["Pokémon", "RPG"],
        exclusive: true,
        imageName: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fm.media-amazon.com%2Fimages%2FI%2F61C6DszMYXL._AC_SL1300_.jpg&f=1&nofb=1&ipt=726ce5b9d46979b7d6492d9b4fd8ce27175eceb3ebff1d39efc6cf55e8137b4d"
      },
      {
        id: "league-of-legends-jinx-60",
        title: "Jinx",
        number: "1602",
        category: "Funko Games",
        series: ["League Of Legends", "MOBA"],
        exclusive: false,
        imageName: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fm.media-amazon.com%2Fimages%2FI%2F718IFH61UkL._AC_SL1500_.jpg&f=1&nofb=1&ipt=48713994654f4a79d1507b596363e8c694b3f68db29267dfbf5df547738eaba7"
      },
      {
        id: "league-of-legends-silco-61",
        title: "Silco",
        number: "61",
        category: "Funko Games",
        series: ["League Of Legends", "MOBA"],
        exclusive: false,
        imageName: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fm.media-amazon.com%2Fimages%2FI%2F6145F03IjqL._AC_SL1300_.jpg&f=1&nofb=1&ipt=5c5656670355ad617aee7b51d2a26a62c4662ecbc27bf7399ddf04f8229c3bab"
      },

      // Funko Anime Category - 10 items
      {
        id: "dragon-ball-goku-01",
        title: "Goku",
        number: "01",
        category: "Funko Anime",
        series: ["Dragon Ball Z", "Shonen"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/870392/Goku_Pins_and_Badges_1baca0a4-7d73-492c-bb42-eb6cb63b3235_large.jpg"
      },
      {
        id: "dragon-ball-vegeta-02",
        title: "Vegeta",
        number: "02",
        category: "Funko Anime",
        series: ["Dragon Ball Z", "Shonen"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/893261/Vegeta_Vinyl_Art_Toys_de4af668-365a-4432-ac19-244d81afcce3_large.jpg"
      },
      {
        id: "naruto-naruto-15",
        title: "Naruto Uzumaki",
        number: "15",
        category: "Funko Anime",
        series: ["Naruto", "Shonen"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/896894/Naruto_PEZ_Dispensers_41817bae-1e3f-4608-bba2-e19171400588.JPG"
      },
      {
        id: "naruto-sasuke-16",
        title: "Sasuke Uchiha",
        number: "16",
        category: "Funko Anime",
        series: ["Naruto", "Shonen"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/800813/Sasuke_Uchiha_Vinyl_Art_Toys_8fbc155a-5fc2-4fd6-ae55-f57fea8b0cf1.png"
      },
      {
        id: "one-piece-luffy-42",
        title: "Monkey D. Luffy",
        number: "42",
        category: "Funko Anime",
        series: ["One Piece", "Shonen"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/589050/Monkey_D._Luffy_Vinyl_Art_Toys_b3d544b4-6ef2-4584-b351-d98ccd469c8d_large.jpg"
      },
      {
        id: "one-piece-zoro-43",
        title: "Roronoa Zoro",
        number: "43",
        category: "Funko Anime",
        series: ["One Piece", "Shonen"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/533798/Roronoa._Zoro_Vinyl_Art_Toys_e7130a74-467d-4623-8e9e-b787d85cce70_large.jpeg"
      },
      {
        id: "my-hero-deku-28",
        title: "Izuku Midoriya",
        number: "28",
        category: "Funko Anime",
        series: ["My Hero Academia", "Shonen"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/844253/Deku_Pins_and_Badges_3f985220-76c4-4885-997f-7a0f8cf6933b_large.JPG"
      },
      {
        id: "my-hero-bakugo-29",
        title: "Katsuki Bakugo",
        number: "29",
        category: "Funko Anime",
        series: ["My Hero Academia", "Shonen"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/775848/Bakugo_Vinyl_Art_Toys_55bab0ed-3c8a-49a4-b1c0-e2b184e1c5bc_large.jpg"
      },
      {
        id: "attack-titan-eren-70",
        title: "Eren Yeager",
        number: "70",
        category: "Funko Anime",
        series: ["Attack on Titan", "Action"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/467840/Eren_Yeager_Vinyl_Art_Toys_a32c8bfc-5e3b-40d5-af70-7b9ef705ca95_large.jpg"
      },
      {
        id: "attack-titan-levi-71",
        title: "Levi Ackerman",
        number: "71",
        category: "Funko Anime",
        series: ["Attack on Titan", "Action"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/480012/Levi_Vinyl_Art_Toys_c315ad92-38a4-4dfd-8ecc-a51f1ace25e1_large.jpg"
      },

      // Funko Music Category - 10 items
      {
        id: "beatles-john-lennon-01",
        title: "John Lennon",
        number: "01",
        category: "Funko Music",
        series: ["The Beatles", "Rock"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/835426/John_Lennon_Bookmarks_1b94bb4e-43bf-431d-b65d-711f73bb9ecd_large.JPG"
      },
      {
        id: "beatles-paul-mccartney-02",
        title: "Paul McCartney",
        number: "02",
        category: "Funko Music",
        series: ["The Beatles", "Rock"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/835427/Paul_McCartney_Bookmarks_e9e430a3-d880-489a-877d-a7bc266eb9f6_large.JPG"
      },
      {
        id: "michael-jackson-thriller-15",
        title: "Michael Jackson",
        number: "15",
        category: "Funko Music",
        series: ["Pop", "King of Pop"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/459804/Michael_Jackson_Vinyl_Art_Toys_83d71737-8c32-4840-bf2a-e42b0128acce_large.jpg"
      },
      {
        id: "queen-freddie-42",
        title: "Freddie Mercury",
        number: "42",
        category: "Funko Music",
        series: ["Queen", "Rock"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/880957/Freddie_Mercury_%2528Live_Aid%2529_Vinyl_Art_Toys_445cefc9-1ea7-4ac0-b969-d5b97ded06b5.jpg"
      },
      {
        id: "kiss-gene-simmons-28",
        title: "Gene Simmons",
        number: "28",
        category: "Funko Music",
        series: ["KISS", "Rock"],
        exclusive: true,
        imageName: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fhttp2.mlstatic.com%2FD_NQ_NP_841001-MLB51811750767_102022-O.webp&f=1&nofb=1&ipt=04d8a1c8e2b55cf67e7309d7c8241e868ede8fd9df5e0e347bb2824fedccd165"
      },
      {
        id: "elvis-presley-50",
        title: "Elvis Presley",
        number: "50",
        category: "Funko Music",
        series: ["Rock and Roll", "Legend"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/471721/Elvis_Presley_Vinyl_Art_Toys_9419f17d-0735-452c-9520-76ae12621d8e_large.png"
      },
      {
        id: "james-hetfield-51",
        title: "James Hetfield",
        number: "51",
        category: "Funko Music",
        series: ["Pop", "Rock and Roll"],
        exclusive: true,
        imageName: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi5.walmartimages.com.mx%2Fmg%2Fgm%2F3pp%2Fasr%2Fa236c75f-ff2e-44b1-83f7-55438b98792f.200864ea0cba9e9a0145e109fdace5bb.jpeg%3FodnHeight%3D612%26odnWidth%3D612%26odnBg%3DFFFFFF&f=1&nofb=1&ipt=50625cbdb82ce111819042c805cdf765cc01cf17654e83fa1275533f733e078c"
      },
      {
        id: "bob-marley-52",
        title: "Bob Marley",
        number: "52",
        category: "Funko Music",
        series: ["Reggae", "Legend"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/471781/Buffalo_Soldier_%2528Bob_Marley%2529_%2528Green_Shirt%2529_Vinyl_Art_Toys_9aa42989-e533-4b09-a4d6-f95dfe8cbd8a_large.jpg"
      },
      {
        id: "ozzy-osbourne-53",
        title: "Ozzy Osbourne",
        number: "53",
        category: "Funko Music",
        series: ["Rock", "Legend"],
        exclusive: true,
        imageName: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fm.media-amazon.com%2Fimages%2FI%2F71QUU8TTZFL._AC_SL1300_.jpg&f=1&nofb=1&ipt=13e173d7b3155d27e647da580d37ee94eb8c057afb6b5bc6a9b78b184b552cba"
      },
      {
        id: "prince-54",
        title: "Prince",
        number: "54",
        category: "Funko Music",
        series: ["Pop", "Legend"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/588249/Prince_Vinyl_Art_Toys_861d0177-712c-409e-8675-161d7da7343c_large.jpeg"
      },

      // Funko Sports Category - 10 items
      {
        id: "nba-lebron-james-01",
        title: "LeBron James",
        number: "01",
        category: "Funko Sports",
        series: ["NBA", "Basketball"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/462008/Lebron_James_%2528Cavaliers%2529_Vinyl_Art_Toys_4afaef19-ea62-4d27-9820-a30a78a406fd_large.jpg"
      },
      {
        id: "nba-michael-jordan-02",
        title: "Michael Jordan",
        number: "02",
        category: "Funko Sports",
        series: ["NBA", "Basketball"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/773990/Michael_Jordan_%2528All_Star%2529_Vinyl_Art_Toys_3f4b9e34-2d67-46dc-a997-a589bcb1483b_large.jpg"
      },
      {
        id: "nfl-tom-brady-15",
        title: "Tom Brady",
        number: "15",
        category: "Funko Sports",
        series: ["NFL", "Football"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/769787/Tom_Brady_%2528White_Hat%2529_Vinyl_Art_Toys_79dd23c5-3a7e-4be7-b2f4-bfb1240f8793_large.jpg"
      },
      {
        id: "soccer-messi-42",
        title: "Lionel Messi",
        number: "42",
        category: "Funko Sports",
        series: ["Soccer", "Football"],
        exclusive: false,
        imageName: "https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Ffunkospace.pe%2Fcdn%2Fshop%2Ffiles%2Ffunko_pop_soccer_mls_inter_miami_lionel_messi_away_funkospace_2_1200x1200.webp%3Fv%3D1741803126&f=1&nofb=1&ipt=6c5612a30b718090dd341691e28d756494e25f3e2386739493c709c6b2166a1b"
      },
      {
        id: "soccer-jordan-henderson-43",
        title: "Jordan Henderson",
        number: "43",
        category: "Funko Sports",
        series: ["Soccer", "Football"],
        exclusive: false,
        imageName: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.pwnedgames.co.za%2Fimages%2Fstories%2Fvirtuemart%2Fproduct%2Ffunko_pop_football_liverpool_fc_jordan_henderson.png&f=1&nofb=1&ipt=9239e77b7b09aa8b980f274ccd2f7ea2b237f410e4c18cbc1ec0c42d2a4442ed"
      },
      {
        id: "baseball-babe-ruth-28",
        title: "Babe Ruth",
        number: "28",
        category: "Funko Sports",
        series: ["MLB", "Baseball"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/790992/Babe_Ruth_%2528Black_and_White%2529_Vinyl_Art_Toys_5ca59ad1-1834-4f4d-9e3d-396aa2dd5215_large.JPG"
      },
      {
        id: "tennis-venus-60",
        title: "Venus Williams",
        number: "60",
        category: "Funko Sports",
        series: ["Tennis", "Legend"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/801121/Venus_Williams_Vinyl_Art_Toys_08dd4c4a-c958-47d5-9c8c-6738e8594294_large.jpg"
      },
      {
        id: "golf-tiger-61",
        title: "Tiger Woods",
        number: "61",
        category: "Funko Sports",
        series: ["Golf", "Legend"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/878820/Tiger_Woods_Vinyl_Art_Toys_a82c0216-10c8-40c7-9ce5-419fadaad21c.JPG"
      },
      {
        id: "boxing-ali-62",
        title: "Muhammad Ali",
        number: "62",
        category: "Funko Sports",
        series: ["Boxing", "Legend"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/722003/Muhammad_Ali_Vinyl_Art_Toys_cece3dfa-4dcf-4f6b-9cd6-6c4fd937133e_large.jpg"
      },
      {
        id: "f1-hamilton-63",
        title: "Lewis Hamilton",
        number: "63",
        category: "Funko Sports",
        series: ["Formula 1", "Racing"],
        exclusive: true,
        imageName: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fmedia.entertainmentearth.com%2Fassets%2Fimages%2F128d01e0dbc041068495724829621ec1xl.jpg&f=1&nofb=1&ipt=aae53c74088f627af106c280986fb2eed57fdd5d5695f9e08a8ddbdc4c0e072e"
      },

      // Funko Comics Category - 10 items
      {
        id: "spiderman-classic-01",
        title: "Spider-Man",
        number: "01",
        category: "Funko Comics",
        series: ["Marvel", "Superheroes"],
        exclusive: false,
        imageName: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ffunko.com%2Fon%2Fdemandware.static%2F-%2FSites-funko-master-catalog%2Fdefault%2Fdwd96ef53c%2Fimages%2Ffunko%2Fupload%2F82500_Marvel_NC_SpiderMan_POP_GLAM-1-WEB.png&f=1&nofb=1&ipt=4fc44cd97ec716ea05f56ca8e67ac4e05759b22ef74ac262ddefdb6f72a43caa"
      },
      {
        id: "spiderman-miles-02",
        title: "Miles Morales",
        number: "02",
        category: "Funko Comics",
        series: ["Marvel", "Superheroes"],
        exclusive: true,
        imageName: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.placedespop.com%2Fimg%2Fproduits%2F3756%2Fspider-man-new-generation-marvel-529-miles-morales-1-1566803617.jpg&f=1&nofb=1&ipt=c02f054c40361bbcf01c11abaab404a008a78dede6831421c87db4b7bbf60391"
      },
      {
        id: "batman-dark-knight-15",
        title: "Batman",
        number: "15",
        category: "Funko Comics",
        series: ["DC Comics", "Superheroes"],
        exclusive: true,
        imageName: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.etsystatic.com%2F26181023%2Fr%2Fil%2F7bc1e8%2F2741448247%2Fil_1588xN.2741448247_8abm.jpg&f=1&nofb=1&ipt=563c1707f2a2655c70e3a36613ca244f7d97673a0ae88f6a4986bc8d56c00c8e"
      },
      {
        id: "superman-man-of-steel-42",
        title: "Superman",
        number: "42",
        category: "Funko Comics",
        series: ["DC Comics", "Superheroes"],
        exclusive: false,
        imageName: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ffigurines-pop.com%2Fmedia%2Fimg%2Ffigurine%2F32-figurine-funko-pop-superman-man-of-steel-superman-box.jpg&f=1&nofb=1&ipt=70ab0e9663a8df36d394dddcc5ddde6deefcf7c9d3b5f8a8ff6da7f056dc3ff0"
      },
      {
        id: "xmen-wolverine-28",
        title: "Wolverine",
        number: "28",
        category: "Funko Comics",
        series: ["X-Men", "Marvel"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/878143/Wolverine_Vinyl_Art_Toys_32d1ef9e-76fd-4186-b87a-67bc1f882891_large.JPG"
      },
      {
        id: "xmen-storm-29",
        title: "Storm",
        number: "29",
        category: "Funko Comics",
        series: ["X-Men", "Marvel"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/797143/Storm_%2528X-Men_20th%2529_Vinyl_Art_Toys_486a896c-c3a5-4a17-959e-8b09a8201c78.JPG"
      },
      {
        id: "avengers-thor-50",
        title: "Thor",
        number: "50",
        category: "Funko Comics",
        series: ["Marvel", "Avengers"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/860724/Thor_Pins_and_Badges_c2fec3cd-19c0-4ee6-b289-2e7ee5f0316e_large.jpg"
      },
      {
        id: "avengers-hulk-51",
        title: "Hulk",
        number: "51",
        category: "Funko Comics",
        series: ["Marvel", "Avengers"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/860722/Hulk_Pins_and_Badges_67208355-1b1a-4a0a-a728-9b5eb89c6335_large.jpg"
      },
      {
        id: "justice-league-flash-52",
        title: "The Flash",
        number: "52",
        category: "Funko Comics",
        series: ["DC Comics", "Justice League"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/858833/The_Flash_Vinyl_Art_Toys_40b3d50f-c3d0-4f49-b922-979811ffdcb5.jpg"
      },
      {
        id: "justice-league-aquaman-53",
        title: "Aquaman",
        number: "53",
        category: "Funko Comics",
        series: ["DC Comics", "Justice League"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/610740/Aquaman_Vinyl_Art_Toys_39189648-3056-48f8-94f5-e75183c7501e_large.jpg"
      },

      // Funko Disney Category - 10 items
      {
        id: "mickey-mouse-classic-01",
        title: "Mickey Mouse",
        number: "01",
        category: "Funko Disney",
        series: ["Disney", "Classic"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/828429/Mickey_Mouse_%2528Disney_50th%2529_Vinyl_Art_Toys_34ae9a82-9900-4fff-9faf-c2971140e7b0.JPG"
      },
      {
        id: "mickey-mouse-sorcerer-02",
        title: "Sorcerer Mickey",
        number: "02",
        category: "Funko Disney",
        series: ["Disney", "Classic"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/828426/Scorcerer_Mickey_%2528Disney_50th%2529_Vinyl_Art_Toys_222618de-0cbd-48b9-bce3-b0d92abb6ef9.JPG"
      },
      {
        id: "frozen-elsa-15",
        title: "Elsa",
        number: "15",
        category: "Funko Disney",
        series: ["Frozen", "Disney"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/873505/Elsa_%2528Frozen_2%2529_Pins_and_Badges_ecb78889-e63a-4363-9103-387e661b235e_large.jpg"
      },
      {
        id: "frozen-anna-16",
        title: "Anna",
        number: "16",
        category: "Funko Disney",
        series: ["Frozen", "Disney"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/873503/Anna_%2528Frozen_2%2529_Pins_and_Badges_f735ba91-e4ac-4b2b-9034-c678c8e8faf3_large.jpg"
      },
      {
        id: "toy-story-buzz-42",
        title: "Buzz Lightyear",
        number: "42",
        category: "Funko Disney",
        series: ["Toy Story", "Pixar"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/796086/Buzz_Lightyear_Pins_and_Badges_25d1c03a-8114-4171-b80d-bd783595cbde_large.jpg"
      },
      {
        id: "toy-story-woody-43",
        title: "Woody",
        number: "43",
        category: "Funko Disney",
        series: ["Toy Story", "Pixar"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/796088/Woody_Pins_and_Badges_db276ce5-052f-4ba3-81fb-0c7b5a2fb922_large.jpg"
      },
      {
        id: "disney-iron-man-28",
        title: "Iron Man",
        number: "28",
        category: "Funko Disney",
        series: ["Marvel", "Avengers"],
        exclusive: false,
        imageName: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ffunko.com%2Fdw%2Fimage%2Fv2%2FBGTS_PRD%2Fon%2Fdemandware.static%2F-%2FSites-funko-master-catalog%2Fdefault%2Fdw923e369f%2Fimages%2Ffunko%2Fupload%2F69050a_POPMarvel_D100_IronMan_Facet_GLAM-1-Funko-WEB.png%3Fsw%3D800%26sh%3D800&f=1&nofb=1&ipt=5e48a7f95912261fe27ca3a1b0ad4e72dccf854e8274e7456968304141bdd05e"
      },
      {
        id: "lion-king-simba-60",
        title: "Simba",
        number: "60",
        category: "Funko Disney",
        series: ["The Lion King", "Disney"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/721671/Simba_Keychains_bbd04d2a-1407-4b14-b047-76321ea352d5_large.jpg"
      },
      {
        id: "little-mermaid-ariel-61",
        title: "Ariel",
        number: "61",
        category: "Funko Disney",
        series: ["The Little Mermaid", "Disney"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/742186/Ariel_%2528Blue_Dress%2529_Prototype_Vinyl_Art_Toys_4ba02a41-14e1-481d-82f2-df5c842bdc25_large.jpeg"
      },
      {
        id: "aladdin-genie-62",
        title: "Genie",
        number: "62",
        category: "Funko Disney",
        series: ["Aladdin", "Disney"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/873491/Genie_Pins_and_Badges_18fb1b56-3999-40e1-9d90-73b03042b7b6_large.jpg"
      },

      // Funko Holiday Category - 10 items
      {
        id: "santa-claus-christmas-01",
        title: "Santa Claus",
        number: "01",
        category: "Funko Holiday",
        series: ["Christmas", "Holiday"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/877966/Freddy_Funko_%2528Holiday%2529_Vinyl_Art_Toys_c510c202-57cc-4a3c-8033-1b64d180fb08.JPG"
      },
      {
        id: "santa-claus-chimney-02",
        title: "Santa with Chimney",
        number: "02",
        category: "Funko Holiday",
        series: ["Christmas", "Holiday"],
        exclusive: true,
        imageName: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn.awsli.com.br%2F2500x2500%2F84%2F84034%2Fproduto%2F234360165%2Ffunko-pop--santa-claus-04-c600-q6vj364i57.jpg&f=1&nofb=1&ipt=bf91035844e776a1e943105775d43de2a893c779debcdae7d072f0e8576c7c0f"
      },
      {
        id: "jack-skellington-halloween-15",
        title: "Jack Skellington",
        number: "15",
        category: "Funko Holiday",
        series: ["Halloween", "Nightmare Before Christmas"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/880596/Jack_Skellington_with_Zero_%252810-Inch%2529_%2528Glow%2529_Vinyl_Art_Toys_11e54e39-6d9b-4b7e-88a4-68dda174545e.JPG"
      },
      {
        id: "sally-halloween-16",
        title: "Sally",
        number: "16",
        category: "Funko Holiday",
        series: ["Halloween", "Nightmare Before Christmas"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/610223/Sally_Skellington_Keychains_5871c436-b565-400d-b843-21021995ec13_large.jpeg"
      },
      {
        id: "easter-bunny-spring-42",
        title: "Easter Bunny",
        number: "42",
        category: "Funko Holiday",
        series: ["Easter", "Spring"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/471884/Easter_Bunny_Vinyl_Art_Toys_ad0ae10f-e4b6-43b5-b5b6-c3bf1ab66938_large.jpg"
      },
      {
        id: "cupid-chewbacca-valentines-28",
        title: "Cupid Chewbacca",
        number: "28",
        category: "Funko Holiday",
        series: ["Valentine's Day", "Love"],
        exclusive: true,
        imageName: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fm.media-amazon.com%2Fimages%2FI%2F71E3pwmmnQL._AC_SL1500_.jpg&f=1&nofb=1&ipt=05c421cf25a406317acbab7538b74901230b010a1b193de2518c153b128848bd"
      },
      {
        id: "ghostface-halloween-50",
        title: "Ghostface",
        number: "50",
        category: "Funko Holiday",
        series: ["Halloween", "Scream"],
        exclusive: true,
        imageName: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ffunko.com%2Fon%2Fdemandware.static%2F-%2FSites-funko-master-catalog%2Fdefault%2Fdw84e7ac0f%2Fimages%2Ffunko%2Fupload%2F81708_Ghostface_Ghostface(Bloody)_POP_GLAM_1_HT-WEB.png&f=1&nofb=1&ipt=8ba854beadd092c13d38e8a578328b24e7dab09a1ea92c794ec2b3f0ab1d47a2"
      },
      {
        id: "frosty-snowman-51",
        title: "Frosty the Snowman",
        number: "51",
        category: "Funko Holiday",
        series: ["Christmas", "Holiday"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/797104/Frosty_the_Snowman_Board_Games_fd1aaaad-3d8a-4a1b-b185-627642e1ab80_large.jpg"
      },
      {
        id: "rudolph-reindeer-52",
        title: "Rudolph",
        number: "52",
        category: "Funko Holiday",
        series: ["Christmas", "Holiday"],
        exclusive: true,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/709136/Rudolph_Vinyl_Art_Toys_969de1e5-e4a7-4988-a59e-58b2f9388808_large.png"
      },
      {
        id: "elf-buddy-53",
        title: "Buddy the Elf",
        number: "53",
        category: "Funko Holiday",
        series: ["Christmas", "Holiday"],
        exclusive: false,
        imageName: "https://images.hobbydb.com/processed_uploads/catalog_item_photo/catalog_item_photo/image/734515/Buddy_the_Elf_PEZ_Dispensers_83f2ba7e-aaf0-4d97-83b0-02cf35f2a274_large.jpg"
      }
    ];
