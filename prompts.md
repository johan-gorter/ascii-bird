# Prompts

These are some of the prompts that were used to create "Ascii bird".

---
Maak een flappy bird webapplicatie op de volgende manier:
- Het is een statische website
- Het maakt gebruik van ES6 javascript modules
- Het is extreem opgesplitst in modules
- De centrale module is de gamestate. Hierin kunnen de volgende waardes aangepast en uitgelezen worden: snelheid, positie van de vogel, of de vliegknop is ingedrukt, en een array met "sprites" (positie, plaatje, grootte). Ook kun je hier subscriben op events zoals flyButtonChanged, init, tick, draw, collided, gameover, reset, enz.
- Er zijn losse modules voor: bird, flybutton, gameloop, canvasrenderer. Elk stuk toekomstige functionaliteit komt zijn eigen module (obstakels, collision detection, scoreboard, powerups, etc.) Modules communiceren met events en gamestate. De architectuur is geoptimaliseerd op leesbaarheid en niet op performance.
- Sprites zijn (voornamelijk) ascii tekens (emoji's).
- De applicatie heeft een event loop die 200 keer per seconde een tick event geeft. Ook is er een draw event die wordt bestuurd door requestAnimationFrame. Het virtuele speelveld heeft coordinaten van -1000,-1000 tot 1000,1000. Elke sprite wordt gepositioneerd op zijn middelpunt.
- Er is een canvasRenderer module die de gamestate rendert op het 'drawcomplete' event op een vierkant fullscreen canvas. 
- Er is een flyButton module die op de init event de knop tekent (een div) en events vuurt als de knop wordt ingedrukt en losgelaten
- Er is een bird module die de vogel sprite tekent en de zwaartekracht toepast en de opwaardse snelheid constant houdt als de flyButton is ingedrukt
- Er is een gameloop module die frame events genereert zolang het nog geen gameover is. Het rendert gameover op de canvas als het game over is. Dan wacht de gameloop module op een klik event en stuurt dan een reset event.
---