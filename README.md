# Delicious Burger 🍔

A modern and responsive website for a fictional gourmet burger restaurant, "Delicious Burger". This project showcases a complete user experience, from browsing the menu to a fully functional shopping cart.

![Delicious Burger Screenshot](https://i.imgur.com/3h24b6x.png)

---

## 🚀 Live Demo

Check out the live version of the project here: [https://projeto-hamburgueria-pi.vercel.app/](https://projeto-hamburgueria-pi.vercel.app/)

---

## ✨ Features

*   **Responsive Design:** Fully responsive layout that looks great on desktops, tablets, and mobile devices.
*   **Dynamic Menu:** Menu items are loaded dynamically from a JSON file, making it easy to update.
*   **Interactive Shopping Cart:**
    *   Add items to the cart.
    *   Update item quantities.
    *   Remove items from the cart.
    *   View the total price.
    *   Cart state is saved to `localStorage`, so it persists across sessions.
*   **Live Search:** Instantly search and filter menu items by name, description, or ingredients.
*   **Multi-page Layout:** Includes Home, Menu, About, and Contact pages.
*   **Modern UI/UX:** Clean and modern design with smooth transitions and user-friendly notifications.
*   **Contact Form:** A functional contact form with basic validation.

---

## 🛠️ Technologies Used

*   **HTML5:** For the structure of the web pages.
*   **CSS3:** For styling, using modern features like Flexbox, Grid, and Custom Properties.
*   **JavaScript (ES6+):** For all the dynamic functionality, including the shopping cart, search, and DOM manipulation. No external frameworks were used to demonstrate proficiency in vanilla JavaScript.

---

## 🏁 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You just need a modern web browser. No special installations are required.

### Installation

1.  Clone the repository:
    ```sh
    git clone https://github.com/your_username/delicious-burger.git
    ```
2.  Navigate to the project directory:
    ```sh
    cd delicious-burger
    ```
3.  Open the `index.html` file in your browser. A live server extension for your code editor is recommended for the best experience (this will handle the `fetch` requests for local JSON and HTML partials correctly).

---

## 📂 Project Structure

```
/
├── assets/
│   ├── css/
│   │   └── style.css         # Main stylesheet
│   ├── data/
│   │   └── menu.json         # Menu data
│   ├── js/
│   │   └── main.js           # Main JavaScript file
│   └── (images...)
├── templates/
│   ├── _header.html          # Header component
│   └── _footer.html          # Footer component
├── index.html                # Home page
├── cardapio.html             # Menu page
├── sobre.html                # About page
├── contato.html              # Contact page
└── README.md
```

---

## ✍️ Author

**Jules** - *Initial work*

---

## 📄 License

This project is licensed under the MIT License.
