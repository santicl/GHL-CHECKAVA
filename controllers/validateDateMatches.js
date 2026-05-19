const validateDateMatches = async (req, res, next) => {
    const { fecha } = req.body;
    const { submissions } = req.body;
    const { numberPerson } = req.body;
    const numberAvailable = req.body.placesAvailable;

    if (!fecha) {
        return res.status(400).json({ error: 'La fecha es requerida' });
    }

    try {
        const submissionsData = submissions || [];
        //console.log(submissionsData.length, 'Cantidad de Registros')

        let totalAdditionalPeople = 0;

        submissionsData.filter(submission => {
            const submissionDate = submission.byn83cFhzqjbcoELPxSo || submission.others.VxRYImDnl8ikmYom7hfz;

            //console.log("FECHA: ", submissionDate)
            
            const personasClient = Number(submission.others.TiOQmVz2d8Bg5vENCD8y) || 0;
            const personasAfiliados = Number(submission['YghfEfFA7h5MW0p8qWXs']) || 0;
            //console.log("NUMERO PERSONAS: ", personasClient)
            
            // Sumamos ambos
            const personas = personasClient + personasAfiliados;
            console.log(personasClient, personasAfiliados)

            //console.log(personas, submissionDate)

            // Se suma la fecha si coincide
            if (submissionDate === fecha) {
                //console.log('Existe coincidencia', submissionDate, personas)
                totalAdditionalPeople += personas;
            }
        
            return submissionDate === fecha;
        }).length;
        

        // Cantidad de personas total
        const availablePlaces = numberAvailable - totalAdditionalPeople;
        const avaNumber = numberAvailable - totalAdditionalPeople;

        // Cupos a solicitar es mayor a cupos disponibles
        if (numberPerson > availablePlaces) {
            return res.json({
                msg: 'No hay Cupos Suficientes',
                ava: false,
                avaNumber: avaNumber
            });
        }

        // Colocar disponibilidad para una siguiente fecha mas cercana o en el formulario colocar mensaje al usuario de buscar disponibilidad para otras fechas

        // Cupos suficientes
        if (availablePlaces <= numberAvailable) {
            return res.json({
                msg: 'Hay Cupos Suficientes',
                ava: true,
                avaNumber: avaNumber
            });
        }

        return res.json({
            msg: 'No se pudo validar',
            ava: false,
            avaNumber: avaNumber
        });

    } catch (error) {
        console.error('Error al validar las fechas:', error);
        res.status(error.response?.status || 500).json({ error: 'Error al validar las fechas', details: error.response?.data });
    }
};

module.exports = validateDateMatches;
