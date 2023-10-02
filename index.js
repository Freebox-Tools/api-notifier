// Importer quelques librairies
const fastify = require("fastify")({ logger: { level: "silent" } })
// const { FreeboxClient } = require("../FreeboxWrapper/index.js")
const { FreeboxClient } = require("freebox-wrapper")
require("dotenv").config()

// Supabase
var { createClient } = require("@supabase/supabase-js")
var supabase = createClient(process.env.SUPABASE_LINK, process.env.SUPABASE_PUBLIC_KEY)
// TODO: on précisera dans Le README qu'il faut pas leak la SUPABASE_PUBLIC_KEY mm si le nom indique qu'elle est publique, c'est pas vrm le cas
// TODO: on précisera aussi dans le README d'activer les RLS (voir celle déjà définit dans la base de données)

// Générer un code unique
async function generateUniqueCode(i = 0){
	// Si on a essayé trop de fois fois, on arrête
	if(i > 20){
		console.error("Failed generating unique code: tried too many times")
		return null
	}

	// On génère un code
	var code = ""
	var possible = "0123456789"
	var length = i < 10 ? 6 : 12 // si on a déjà essayé 10 fois, on passe à 12 caractères au lieu de 6
	for(var i = 0; i < length; i++) code += possible.charAt(Math.floor(Math.random() * possible.length))

	// On le vérifie
	var { data, error } = await supabase.from("uniquecode").select("*").eq("code", code)
	if(error){
		console.error("Failed checking if unique code is unique:", error)
		return generateUniqueCode(i += 1)
	}

	// Si on a déjà ce code, on en génère un autre
	if(data?.length > 0) return generateUniqueCode(i += 1)

	// Sinon, on retourne le code
	return code
}

// Supprimer les codes uniques trop anciens
async function deleteExpiredUniquecode(){
	// Obtenir les codes uniques
	console.log("Trying to delete expired unique code...")
	var { data, error } = await supabase.from("uniquecode").select("*")
	console.log(`Found ${data?.length} unique code(s)`)

	// Si on a une erreur, ou pas de données
	if(error) return console.error("Failed getting unique code:", error)
	if(!data) return

	// Pour chaque code
	for(var i = 0; i < data.length; i++){
		// Supprimer s'il est trop ancien
		if(data?.[i]?.created){
			var created = new Date(data[i].created)
			if(created < new Date(Date.now() - (1000 * 60 * 30))){ // 30 minutes
				var { error } = await supabase.from("uniquecode").delete().match({ code: data[i].code })
				if(error) console.error("Failed deleting unique code:", error)
				else console.log("Deleted unique code:", data[i].code)
			} else console.log("unique code not expired:", data[i].code)
		}
	}
}
deleteExpiredUniquecode()
setInterval(async () => {
	deleteExpiredUniquecode()
}, 1000 * 60 * 60) // toutes les heures

// Afficher des infos basiques
fastify.all("/", async (req, res) => {
	return res.redirect("https://github.com/Freebox-Tools/api-notifier")
})

// Associer une Freebox à un compte Telegram
fastify.post("/associateBoxWithTelegram", async (req, res) => {
	// Récupérer les données depuis le body
	var { appToken, apiDomain, httpsPort } = req.body
	if(!appToken || !apiDomain || !httpsPort) throw { statusCode: 400, error: "Missing Parameters", message: "Des arguments sont manquants dans le body.", details: "appToken, apiDomain, httpsPort sont tous nécessaires." }

	// On tente de se connecter à la box
	console.log("Trying to associate a new box...")
	var client = new FreeboxClient({ appToken, apiDomain, httpsPort, appId: "fbx.notifier" })
	var response = await client.authentificate()

	// Si on a une erreur
	if(!response?.success){
		console.log("Failed to associate a new box, canceling.")
		throw { statusCode: 400, error: "Unable to connect", message: "La connexion à votre Freebox n'a pas pu être réalisé.", details: response }
	} else console.log("New Freebox associated successfully.")

	// On génère un code unique
	console.log("Generating unique code for the new box...")
	var code = await generateUniqueCode()
	if(!code) throw { statusCode: 500, error: "Failed generating unique code", message: "Une erreur est survenue lors de la génération du code d'association à Telegram. Veuillez réessayer plus tard." }

	// On ajoute le code à la base de données
	console.log("Adding unique code to the database...")
	var { error } = await supabase.from("uniquecode").insert({
		code,
		created: new Date(),
		content: {
			appToken,
			apiDomain: client?.freebox?.api_domain || apiDomain,
			httpsPort: client?.freebox?.https_port || httpsPort,
			boxModel: client?.freebox?.box_model_name || null,
		}
	})

	// Si on a une erreur
	if(error){
		console.error("Failed adding unique code to the database:", error)
		throw { statusCode: 500, error: "Failed adding unique code to the database", message: "Une erreur est survenue lors de l'inscription des informations de votre Freebox à la base de données. Veuillez réessayer plus tard." }
	}

	// On retourne le code
	return { success: true, code }
})

// Démarrer le serveur
fastify.listen({ port: process.env.PORT || 3000 }, (err) => {
	if(err) fastify.log.error(err), process.exit(1)
	console.log(`Server listening on port ${fastify.server.address().port}`)
})