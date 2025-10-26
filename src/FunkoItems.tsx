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
        imageName: "https://i.ebayimg.com/images/g/6VIAAOSwYz1jDdDz/s-l1600.jpg"
      },
      {
        id: "friends-chandler-bing-03",
        title: "Chandler Bing",
        number: "264",
        category: "Funko TV",
        series: ["Friends", "Sitcom"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/Kd8AAOSwGzRkNz~H/s-l1600.jpg"
      },
      {
        id: "stranger-things-eleven-15",
        title: "Eleven",
        number: "15",
        category: "Funko TV",
        series: ["Stranger Things", "Sci-Fi"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/5QwAAOSwvF9iRn~p/s-l1600.jpg"
      },
      {
        id: "stranger-things-joey-16",
        title: "Steve Harrington", // ⚠️ Fixed: "Joey Wheeler" was incorrect
        number: "16",
        category: "Funko TV",
        series: ["Stranger Things", "Sci-Fi"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/0f8AAOSwq~9iVJs7/s-l1600.jpg"
      },
      {
        id: "office-michael-scott-42",
        title: "Michael Scott",
        number: "42",
        category: "Funko TV",
        series: ["The Office", "Sitcom"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/3~UAAOSwVzFhZ6uD/s-l1600.jpg"
      },
      {
        id: "office-dwight-schrute-43",
        title: "Dwight Schrute",
        number: "43",
        category: "Funko TV",
        series: ["The Office", "Sitcom"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/1f8AAOSwq~9iVJtD/s-l1600.jpg"
      },
      {
        id: "game-of-thrones-daenerys-28",
        title: "Daenerys Targaryen",
        number: "28",
        category: "Funko TV",
        series: ["Game of Thrones", "Fantasy"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/2f8AAOSwq~9iVJuJ/s-l1600.jpg"
      },
      {
        id: "game-of-thrones-jon-snow-29",
        title: "Jon Snow",
        number: "29",
        category: "Funko TV",
        series: ["Game of Thrones", "Fantasy"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/3f8AAOSwq~9iVJvP/s-l1600.jpg"
      },
      {
        id: "breaking-bad-walter-white-50",
        title: "Walter White",
        number: "50",
        category: "Funko TV",
        series: ["Breaking Bad", "Drama"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/4f8AAOSwq~9iVJwV/s-l1600.jpg"
      },

      // Funko Movies Category - 10 items
      {
        id: "star-wars-darth-vader-01",
        title: "Darth Vader",
        number: "01",
        category: "Funko Movies",
        series: ["Star Wars", "Sci-Fi"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/0R8AAOSwq~9iVJj~/s-l1600.jpg"
      },
      {
        id: "star-wars-luke-skywalker-02",
        title: "Luke Skywalker",
        number: "02",
        category: "Funko Movies",
        series: ["Star Wars", "Sci-Fi"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/5f8AAOSwq~9iVJxZ/s-l1600.jpg"
      },
      {
        id: "star-wars-yoda-03",
        title: "Yoda",
        number: "03",
        category: "Funko Movies",
        series: ["Star Wars", "Sci-Fi"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/6f8AAOSwq~9iVJyf/s-l1600.jpg"
      },
      {
        id: "harry-potter-harry-15",
        title: "Harry Potter",
        number: "15",
        category: "Funko Movies",
        series: ["Harry Potter", "Fantasy"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/9WcAAOSwDfNiXbJm/s-l1600.jpg"
      },
      {
        id: "harry-potter-hermione-16",
        title: "Hermione Granger",
        number: "16",
        category: "Funko Movies",
        series: ["Harry Potter", "Fantasy"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/7f8AAOSwq~9iVJzl/s-l1600.jpg"
      },
      {
        id: "marvel-iron-man-42",
        title: "Iron Man",
        number: "42",
        category: "Funko Movies",
        series: ["Marvel", "Superheroes"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/3JMAAOSwQ~FiVJkF/s-l1600.jpg"
      },
      {
        id: "marvel-captain-america-43",
        title: "Captain America",
        number: "43",
        category: "Funko Movies",
        series: ["Marvel", "Superheroes"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/8f8AAOSwq~9iVJ~r/s-l1600.jpg"
      },
      {
        id: "dc-batman-28",
        title: "Batman",
        number: "28",
        category: "Funko Movies",
        series: ["DC Comics", "Superheroes"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/v~8AAOSw7fFiVJl~/s-l1600.jpg"
      },
      {
        id: "dc-superman-29",
        title: "Superman",
        number: "29",
        category: "Funko Movies",
        series: ["DC Comics", "Superheroes"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/9f8AAOSwq~9iVK0x/s-l1600.jpg"
      },
      {
        id: "dc-wonder-woman-30",
        title: "Wonder Woman",
        number: "30",
        category: "Funko Movies",
        series: ["DC Comics", "Superheroes"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/af8AAOSwq~9iVK13/s-l1600.jpg"
      },

      // Funko WWE Category - 10 items
      {
        id: "wwe-john-cena-01",
        title: "John Cena",
        number: "01",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/bf8AAOSwq~9iVK29/s-l1600.jpg"
      },
      {
        id: "wwe-the-rock-15",
        title: "The Rock",
        number: "15",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/cf8AAOSwq~9iVK3F/s-l1600.jpg"
      },
      {
        id: "wwe-stone-cold-42",
        title: "Stone Cold Steve Austin",
        number: "42",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/df8AAOSwq~9iVK4L/s-l1600.jpg"
      },
      {
        id: "wwe-undertaker-28",
        title: "The Undertaker",
        number: "28",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/ef8AAOSwq~9iVK5R/s-l1600.jpg"
      },
      {
        id: "wwe-randy-orton-29",
        title: "Randy Orton",
        number: "29",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/ff8AAOSwq~9iVK6X/s-l1600.jpg"
      },
      {
        id: "wwe-triple-h-30",
        title: "Triple H",
        number: "30",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/gf8AAOSwq~9iVK7d/s-l1600.jpg"
      },
      {
        id: "wwe-shawn-michaels-31",
        title: "Shawn Michaels",
        number: "31",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/hf8AAOSwq~9iVK8j/s-l1600.jpg"
      },
      {
        id: "wwe-bret-hart-32",
        title: "Bret Hart",
        number: "32",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/if8AAOSwq~9iVK9p/s-l1600.jpg"
      },
      {
        id: "wwe-roman-reigns-33",
        title: "Roman Reigns",
        number: "33",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/jf8AAOSwq~9iVKav/s-l1600.jpg"
      },
      {
        id: "wwe-brock-lesnar-34",
        title: "Brock Lesnar",
        number: "34",
        category: "Funko WWE",
        series: ["WWE", "Wrestling"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/kf8AAOSwq~9iVKb1/s-l1600.jpg"
      },

      // Funko Games Category - 10 items
      {
        id: "fortnite-skull-trooper-01",
        title: "Skull Trooper",
        number: "01",
        category: "Funko Games",
        series: ["Fortnite", "Battle Royale"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/lf8AAOSwq~9iVKc7/s-l1600.jpg"
      },
      {
        id: "fortnite-onesie-02",
        title: "Onesie",
        number: "02",
        category: "Funko Games",
        series: ["Fortnite", "Battle Royale"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/mf8AAOSwq~9iVKdD/s-l1600.jpg"
      },
      {
        id: "overwatch-tracer-15",
        title: "Tracer",
        number: "15",
        category: "Funko Games",
        series: ["Overwatch", "FPS"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/nf8AAOSwq~9iVKeL/s-l1600.jpg"
      },
      {
        id: "overwatch-mercy-16",
        title: "Mercy",
        number: "16",
        category: "Funko Games",
        series: ["Overwatch", "FPS"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/of8AAOSwq~9iVKfT/s-l1600.jpg"
      },
      {
        id: "halo-master-chief-42",
        title: "Master Chief",
        number: "42",
        category: "Funko Games",
        series: ["Halo", "FPS"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/2f8AAOSwq~9iVJrZ/s-l1600.jpg"
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
        imageName: "https://i.ebayimg.com/images/g/1f8AAOSwq~9iVJqT/s-l1600.jpg"
      },
      {
        id: "pokemon-charizard-29",
        title: "Charizard",
        number: "29",
        category: "Funko Games",
        series: ["Pokémon", "RPG"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/qf8AAOSwq~9iVKhj/s-l1600.jpg"
      },
      {
        id: "mario-super-mario-60",
        title: "Super Mario",
        number: "60",
        category: "Funko Games",
        series: ["Super Mario", "Platformer"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/rf8AAOSwq~9iVKir/s-l1600.jpg"
      },
      {
        id: "mario-luigi-61",
        title: "Luigi",
        number: "61",
        category: "Funko Games",
        series: ["Super Mario", "Platformer"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/sf8AAOSwq~9iVKjz/s-l1600.jpg"
      },

      // Funko Anime Category - 10 items
      {
        id: "dragon-ball-goku-01",
        title: "Goku",
        number: "01",
        category: "Funko Anime",
        series: ["Dragon Ball Z", "Shonen"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/tf8AAOSwq~9iVKk5/s-l1600.jpg"
      },
      {
        id: "dragon-ball-vegeta-02",
        title: "Vegeta",
        number: "02",
        category: "Funko Anime",
        series: ["Dragon Ball Z", "Shonen"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/uf8AAOSwq~9iVKlB/s-l1600.jpg"
      },
      {
        id: "naruto-naruto-15",
        title: "Naruto Uzumaki",
        number: "15",
        category: "Funko Anime",
        series: ["Naruto", "Shonen"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/vf8AAOSwq~9iVKmJ/s-l1600.jpg"
      },
      {
        id: "naruto-sasuke-16",
        title: "Sasuke Uchiha",
        number: "16",
        category: "Funko Anime",
        series: ["Naruto", "Shonen"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/wf8AAOSwq~9iVKnP/s-l1600.jpg"
      },
      {
        id: "one-piece-luffy-42",
        title: "Monkey D. Luffy",
        number: "42",
        category: "Funko Anime",
        series: ["One Piece", "Shonen"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/xf8AAOSwq~9iVKoV/s-l1600.jpg"
      },
      {
        id: "one-piece-zoro-43",
        title: "Roronoa Zoro",
        number: "43",
        category: "Funko Anime",
        series: ["One Piece", "Shonen"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/yf8AAOSwq~9iVKpb/s-l1600.jpg"
      },
      {
        id: "my-hero-deku-28",
        title: "Izuku Midoriya",
        number: "28",
        category: "Funko Anime",
        series: ["My Hero Academia", "Shonen"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/zf8AAOSwq~9iVKqn/s-l1600.jpg"
      },
      {
        id: "my-hero-bakugo-29",
        title: "Katsuki Bakugo",
        number: "29",
        category: "Funko Anime",
        series: ["My Hero Academia", "Shonen"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/Ag8AAOSwq~9iVKrv/s-l1600.jpg"
      },
      {
        id: "attack-titan-eren-70",
        title: "Eren Yeager",
        number: "70",
        category: "Funko Anime",
        series: ["Attack on Titan", "Action"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/Bg8AAOSwq~9iVKs1/s-l1600.jpg"
      },
      {
        id: "attack-titan-levi-71",
        title: "Levi Ackerman",
        number: "71",
        category: "Funko Anime",
        series: ["Attack on Titan", "Action"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/Cg8AAOSwq~9iVKt7/s-l1600.jpg"
      },

      // Funko Music Category - 10 items
      {
        id: "beatles-john-lennon-01",
        title: "John Lennon",
        number: "01",
        category: "Funko Music",
        series: ["The Beatles", "Rock"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/Dg8AAOSwq~9iVKuF/s-l1600.jpg"
      },
      {
        id: "beatles-paul-mccartney-02",
        title: "Paul McCartney",
        number: "02",
        category: "Funko Music",
        series: ["The Beatles", "Rock"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/Eg8AAOSwq~9iVKvN/s-l1600.jpg"
      },
      {
        id: "michael-jackson-thriller-15",
        title: "Michael Jackson",
        number: "15",
        category: "Funko Music",
        series: ["Pop", "King of Pop"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/6f4AAOSwQ~FiVJnT/s-l1600.jpg"
      },
      {
        id: "queen-freddie-42",
        title: "Freddie Mercury",
        number: "42",
        category: "Funko Music",
        series: ["Queen", "Rock"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/7XMAAOSwQ~FiVJmN/s-l1600.jpg"
      },
      {
        id: "kiss-gene-simmons-28",
        title: "Gene Simmons",
        number: "28",
        category: "Funko Music",
        series: ["KISS", "Rock"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/Fg8AAOSwq~9iVKwV/s-l1600.jpg"
      },
      {
        id: "elvis-presley-50",
        title: "Elvis Presley",
        number: "50",
        category: "Funko Music",
        series: ["Rock and Roll", "Legend"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/Gg8AAOSwq~9iVKxd/s-l1600.jpg"
      },
      {
        id: "madonna-51",
        title: "Madonna",
        number: "51",
        category: "Funko Music",
        series: ["Pop", "Queen of Pop"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/Hg8AAOSwq~9iVKyl/s-l1600.jpg"
      },
      {
        id: "bob-marley-52",
        title: "Bob Marley",
        number: "52",
        category: "Funko Music",
        series: ["Reggae", "Legend"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/Ig8AAOSwq~9iVKzt/s-l1600.jpg"
      },
      {
        id: "david-bowie-53",
        title: "David Bowie",
        number: "53",
        category: "Funko Music",
        series: ["Rock", "Legend"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/Jg8AAOSwq~9iVL01/s-l1600.jpg"
      },
      {
        id: "prince-54",
        title: "Prince",
        number: "54",
        category: "Funko Music",
        series: ["Pop", "Legend"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/Kg8AAOSwq~9iVL19/s-l1600.jpg"
      },

      // Funko Sports Category - 10 items
      {
        id: "nba-lebron-james-01",
        title: "LeBron James",
        number: "01",
        category: "Funko Sports",
        series: ["NBA", "Basketball"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/Lg8AAOSwq~9iVL2F/s-l1600.jpg"
      },
      {
        id: "nba-michael-jordan-02",
        title: "Michael Jordan",
        number: "02",
        category: "Funko Sports",
        series: ["NBA", "Basketball"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/3XUAAOSwVzFiVJo~/s-l1600.jpg"
      },
      {
        id: "nfl-tom-brady-15",
        title: "Tom Brady",
        number: "15",
        category: "Funko Sports",
        series: ["NFL", "Football"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/0f8AAOSwq~9iVJpN/s-l1600.jpg"
      },
      {
        id: "soccer-messi-42",
        title: "Lionel Messi",
        number: "42",
        category: "Funko Sports",
        series: ["Soccer", "Football"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/Mg8AAOSwq~9iVL3N/s-l1600.jpg"
      },
      {
        id: "soccer-ronaldo-43",
        title: "Cristiano Ronaldo",
        number: "43",
        category: "Funko Sports",
        series: ["Soccer", "Football"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/Ng8AAOSwq~9iVL4V/s-l1600.jpg"
      },
      {
        id: "baseball-babe-ruth-28",
        title: "Babe Ruth",
        number: "28",
        category: "Funko Sports",
        series: ["MLB", "Baseball"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/Og8AAOSwq~9iVL5d/s-l1600.jpg"
      },
      {
        id: "tennis-serena-60",
        title: "Serena Williams",
        number: "60",
        category: "Funko Sports",
        series: ["Tennis", "Legend"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/Pg8AAOSwq~9iVL6l/s-l1600.jpg"
      },
      {
        id: "golf-tiger-61",
        title: "Tiger Woods",
        number: "61",
        category: "Funko Sports",
        series: ["Golf", "Legend"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/Qg8AAOSwq~9iVL7t/s-l1600.jpg"
      },
      {
        id: "boxing-ali-62",
        title: "Muhammad Ali",
        number: "62",
        category: "Funko Sports",
        series: ["Boxing", "Legend"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/Rg8AAOSwq~9iVL81/s-l1600.jpg"
      },
      {
        id: "f1-schumacher-63",
        title: "Michael Schumacher",
        number: "63",
        category: "Funko Sports",
        series: ["Formula 1", "Racing"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/Sg8AAOSwq~9iVL99/s-l1600.jpg"
      },

      // Funko Comics Category - 10 items
      {
        id: "spiderman-classic-01",
        title: "Spider-Man",
        number: "01",
        category: "Funko Comics",
        series: ["Marvel", "Superheroes"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/Tg8AAOSwq~9iVLAH/s-l1600.jpg"
      },
      {
        id: "spiderman-miles-02",
        title: "Miles Morales",
        number: "02",
        category: "Funko Comics",
        series: ["Marvel", "Superheroes"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/Ug8AAOSwq~9iVLBP/s-l1600.jpg"
      },
      {
        id: "batman-dark-knight-15",
        title: "Batman",
        number: "15",
        category: "Funko Comics",
        series: ["DC Comics", "Superheroes"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/Vg8AAOSwq~9iVLCX/s-l1600.jpg"
      },
      {
        id: "superman-man-of-steel-42",
        title: "Superman",
        number: "42",
        category: "Funko Comics",
        series: ["DC Comics", "Superheroes"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/Wg8AAOSwq~9iVLDf/s-l1600.jpg"
      },
      {
        id: "xmen-wolverine-28",
        title: "Wolverine",
        number: "28",
        category: "Funko Comics",
        series: ["X-Men", "Marvel"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/Xg8AAOSwq~9iVLEn/s-l1600.jpg"
      },
      {
        id: "xmen-storm-29",
        title: "Storm",
        number: "29",
        category: "Funko Comics",
        series: ["X-Men", "Marvel"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/Yg8AAOSwq~9iVLFv/s-l1600.jpg"
      },
      {
        id: "avengers-thor-50",
        title: "Thor",
        number: "50",
        category: "Funko Comics",
        series: ["Marvel", "Avengers"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/Zg8AAOSwq~9iVLG3/s-l1600.jpg"
      },
      {
        id: "avengers-hulk-51",
        title: "Hulk",
        number: "51",
        category: "Funko Comics",
        series: ["Marvel", "Avengers"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/ah8AAOSwq~9iVLHB/s-l1600.jpg"
      },
      {
        id: "justice-league-flash-52",
        title: "The Flash",
        number: "52",
        category: "Funko Comics",
        series: ["DC Comics", "Justice League"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/bh8AAOSwq~9iVLIJ/s-l1600.jpg"
      },
      {
        id: "justice-league-aquaman-53",
        title: "Aquaman",
        number: "53",
        category: "Funko Comics",
        series: ["DC Comics", "Justice League"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/ch8AAOSwq~9iVLJR/s-l1600.jpg"
      },

      // Funko Disney Category - 10 items
      {
        id: "mickey-mouse-classic-01",
        title: "Mickey Mouse",
        number: "01",
        category: "Funko Disney",
        series: ["Disney", "Classic"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/dh8AAOSwq~9iVLKZ/s-l1600.jpg"
      },
      {
        id: "mickey-mouse-sorcerer-02",
        title: "Sorcerer Mickey",
        number: "02",
        category: "Funko Disney",
        series: ["Disney", "Classic"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/eh8AAOSwq~9iVLLh/s-l1600.jpg"
      },
      {
        id: "frozen-elsa-15",
        title: "Elsa",
        number: "15",
        category: "Funko Disney",
        series: ["Frozen", "Disney"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/fh8AAOSwq~9iVLMp/s-l1600.jpg"
      },
      {
        id: "frozen-anna-16",
        title: "Anna",
        number: "16",
        category: "Funko Disney",
        series: ["Frozen", "Disney"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/gh8AAOSwq~9iVLNx/s-l1600.jpg"
      },
      {
        id: "toy-story-buzz-42",
        title: "Buzz Lightyear",
        number: "42",
        category: "Funko Disney",
        series: ["Toy Story", "Pixar"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/hh8AAOSwq~9iVLQ5/s-l1600.jpg"
      },
      {
        id: "toy-story-woody-43",
        title: "Woody",
        number: "43",
        category: "Funko Disney",
        series: ["Toy Story", "Pixar"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/ih8AAOSwq~9iVLRD/s-l1600.jpg"
      },
      {
        id: "disney-iron-man-28",
        title: "Iron Man",
        number: "28",
        category: "Funko Disney",
        series: ["Marvel", "Avengers"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/jh8AAOSwq~9iVLSN/s-l1600.jpg"
      },
      {
        id: "lion-king-simba-60",
        title: "Simba",
        number: "60",
        category: "Funko Disney",
        series: ["The Lion King", "Disney"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/kh8AAOSwq~9iVLTZ/s-l1600.jpg"
      },
      {
        id: "little-mermaid-ariel-61",
        title: "Ariel",
        number: "61",
        category: "Funko Disney",
        series: ["The Little Mermaid", "Disney"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/lh8AAOSwq~9iVLUh/s-l1600.jpg"
      },
      {
        id: "aladdin-genie-62",
        title: "Genie",
        number: "62",
        category: "Funko Disney",
        series: ["Aladdin", "Disney"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/mh8AAOSwq~9iVLVp/s-l1600.jpg"
      },

      // Funko Holiday Category - 10 items
      {
        id: "santa-claus-christmas-01",
        title: "Santa Claus",
        number: "01",
        category: "Funko Holiday",
        series: ["Christmas", "Holiday"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/nh8AAOSwq~9iVLWx/s-l1600.jpg"
      },
      {
        id: "santa-claus-chimney-02",
        title: "Santa with Chimney",
        number: "02",
        category: "Funko Holiday",
        series: ["Christmas", "Holiday"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/oh8AAOSwq~9iVLX5/s-l1600.jpg"
      },
      {
        id: "jack-skellington-halloween-15",
        title: "Jack Skellington",
        number: "15",
        category: "Funko Holiday",
        series: ["Halloween", "Nightmare Before Christmas"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/ph8AAOSwq~9iVLYB/s-l1600.jpg"
      },
      {
        id: "sally-halloween-16",
        title: "Sally",
        number: "16",
        category: "Funko Holiday",
        series: ["Halloween", "Nightmare Before Christmas"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/qh8AAOSwq~9iVLZL/s-l1600.jpg"
      },
      {
        id: "easter-bunny-spring-42",
        title: "Easter Bunny",
        number: "42",
        category: "Funko Holiday",
        series: ["Easter", "Spring"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/rh8AAOSwq~9iVLaT/s-l1600.jpg"
      },
      {
        id: "cupid-valentines-28",
        title: "Cupid",
        number: "28",
        category: "Funko Holiday",
        series: ["Valentine's Day", "Love"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/sh8AAOSwq~9iVLbb/s-l1600.jpg"
      },
      {
        id: "ghostface-halloween-50",
        title: "Ghostface",
        number: "50",
        category: "Funko Holiday",
        series: ["Halloween", "Scream"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/th8AAOSwq~9iVLcn/s-l1600.jpg"
      },
      {
        id: "frosty-snowman-51",
        title: "Frosty the Snowman",
        number: "51",
        category: "Funko Holiday",
        series: ["Christmas", "Holiday"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/uh8AAOSwq~9iVLd1/s-l1600.jpg"
      },
      {
        id: "rudolph-reindeer-52",
        title: "Rudolph",
        number: "52",
        category: "Funko Holiday",
        series: ["Christmas", "Holiday"],
        exclusive: true,
        imageName: "https://i.ebayimg.com/images/g/vh8AAOSwq~9iVLe9/s-l1600.jpg"
      },
      {
        id: "elf-buddy-53",
        title: "Buddy the Elf",
        number: "53",
        category: "Funko Holiday",
        series: ["Christmas", "Holiday"],
        exclusive: false,
        imageName: "https://i.ebayimg.com/images/g/wh8AAOSwq~9iVLfH/s-l1600.jpg"
      }
    ];
