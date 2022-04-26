
const getProfile = async (req, res, next) => {
    const {Profile} = req.app.get('models')
    const profile = await Profile.findOne({where: {id: req.query.profile_id || 0}})
    if(!profile) return res.send('Invalid profile, profile not found')
    req.profile = profile
    next()
}

module.exports = {getProfile}