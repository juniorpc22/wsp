const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
require("dotenv").config();

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
//const MockAdapter = require('@bot-whatsapp/database/mock')
const MongoAdapter = require('@bot-whatsapp/database/mongo')
const path = require("path")
const fs = require("fs")
const chat = require("./chatGPT")
const { handlerAI } = require("./whisper")

const menuPath = path.join(__dirname, "mensajes", "menu.txt");
const menu = fs.readFileSync(menuPath, "utf8")
const PathConsultas = path.join(__dirname, "mensajes", "promptconsultas.txt");
const promptconsultas = fs.readFileSync(PathConsultas, "utf8")


const flowWelcome = addKeyword(EVENTS.WELCOME)
    .addAnswer('¡Bienvenido a GIDALIN IMPORTACIONES! Descubre'+
        'la mejor calidad en productos importados y un servicio excepcional.'+
        '🌟 ¿En qué puedo ayudarte hoy? ✨Estamos para apoyarte. ')
    .addAnswer ('Escribe *informacion* para ver las opciones',
        {
        
        delay: 100,
    },
        async (ctx, ctxFn)  =>{ 
            if (ctx.body.includes("informacion","info")){
                await ctxFn.flowDynamic("")
            } else{
                await ctxFn.flowDynamic("") 
            }
        })

const flowPrincipal = addKeyword(EVENTS.ACTION)
    .addAnswer('¡Bienvenido a GIDALIN IMPORTACIONES! Descubre'+
        'la mejor calidad en productos importados y un servicio excepcional.'+
        '🌟 ¿En qué puedo ayudarte hoy? ✨Estamos para apoyarte. ')
    .addAnswer( 'Escribe *atras* para ver las opciones')
    
    
const flowHorario = addKeyword(EVENTS.ACTION)
    .addAnswer([
        '🕒 el horario de atencion es de',
        'lunes a sabado de 8 am - 8 pm',
        'Sábado: 10:00 AM - 4:00 PM',
        'Domingo: Cerrado',
        '¡Estamos aquí para servirte! ⏰',
        'te esperamos!',
        '🔙 escriba *atras* para volver atras ',
    ])

const flowContacto = addKeyword(EVENTS.ACTION)
    .addAnswer([
        '📒 Puedes contactar la dueña, Gidalin Condor, al número +51 994 797 923 o enviar un correo a Gidalin_R15@gmail.com.',
        '¡Estamos aquí para escucharte! 📧',
        '🔙 escriba *atras* para volver atras ',
    ])

const flowUbicacion = addKeyword(EVENTS.ACTION)
    .addAnswer([
        '📍 Ubicación',
        'Encuentra nuestra tienda fácilmente y ven a visitarnos. ¡Te esperamos! 📌',
    
        'Estamos ubicados en Av. Manuel A. Odria 450, Tarma, Perú. Puedes vernos en Google Maps aquí. https://maps.app.goo.gl/mrbB7qTSp4LuVTJh8 ¡Ven y descubre nuestras ofertas exclusivas!',
        '🔙 escriba *atras* para volver atras ',
    ])

const flowProducto = addKeyword(EVENTS.ACTION)
    .addAnswer([
        '🙌 este es el catalago',        
        "https://drive.google.com/uc?export=download&id=1KvYcDCiNrCoUl2FUcsY4oe-7jNGmwUOh",
        '🔙 escriba *atras* para volver atras '
    ]);

const flowConsultas = addKeyword(EVENTS.ACTION)
    .addAnswer('Este es el flow consultas')
    .addAnswer("realiza tu consulta", { capture: true }, async (ctx, ctxFn) => {
        const prompt = promptconsultas
        const consulta = ctx.body
        const answer = await chat(prompt, consulta)
        await ctxFn.flowDynamic(answer.content)
    })
const flowVoice = addKeyword (EVENTS.VOICE_NOTE).addAnswer("esta es una nota de voz", null, async(ctx, ctxFn)=>{
    const text = await handlerAI(ctx)
    const prompt = promptconsultas
    const consulta = text
    const answer = await chat(prompt, consulta)
    await ctxFn.flowDynamic(answer.content)
})

const menuFlow = addKeyword(["informacion","info","información","atras"]).addAnswer(
    menu,
    { capture: true },
    async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
        if (!["horario", "contacto", "ubicacion","producto","consulta", "salir"].includes(ctx.body)) {
            return fallBack(
                "Respuesta no válida, por favor selecciona una de las opciones."
            );
        }
        switch (ctx.body) {
            case "horario":
                return gotoFlow(flowHorario);
            case "contacto":
                return gotoFlow(flowContacto);
            case "ubicacion":
                return gotoFlow(flowUbicacion);
            case "producto":
                return gotoFlow(flowProducto);
            case "consulta":
                return gotoFlow(flowConsultas);
            case "salir":
                return await flowDynamic(
                    "Saliendo... Puedes volver a acceder a este menu escribiendo '*informacion*'"
                );
        }
    }
);   

const main = async () => {
    const adapterDB = new MongoAdapter({
        dbUri: process.env.MONGO_DB_URI,
        dbName:"whatsappTest"
    })
    
    const adapterFlow = createFlow([flowPrincipal,flowWelcome,menuFlow,flowHorario,flowContacto,flowUbicacion,flowProducto,flowConsultas,flowVoice])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()