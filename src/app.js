const express = require('express');
const bodyParser = require('body-parser');
const {Op} = require("sequelize")
const {sequelize} = require('./model')
const {getProfile} = require('./middleware/getProfile')
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

/**
 * FIX ME!
 * @returns contract by id
 */

//Get Contract Table
app.get('/contract/:id',getProfile, async(req,res)=>{
    const {Contract} = req.app.get('models')
    const {id} = req.params
    const contract = await Contract.findOne({where: {id}})
    if(!contract) return res.status(404).end()
    res.json(contract)
})

//Get Generic table as selected by the user
app.get('/:table/:id', getProfile,async (req, res) =>{
    if (req.params.table == "contract") {
        const {Contract} = req.app.get('models')
        const {id} = req.params
        // console.log(id)
        const contract = await Contract.findOne({where: {id}})
        if(!contract) return res.status(404).end()
        res.json(contract)
    }else if (req.params.table == "profile") {
        const {Profile} = req.app.get('models')
        const {id} = req.params
        const profile = await Profile.findOne({where: {id} })
        if(!profile) return res.status(404).end()
        res.json(profile)
    }if (req.params.table == "job") {
        const {Job} = req.app.get('models')
        const {id} = req.params
        const job = await Job.findOne({where: {id}})
        if(!job) return res.status(404).end()
        res.json(job)
    }else{
        res.json("Table not found")
    }
})

//Get the list of active contracts
app.get('/contract', getProfile, async(req,res)=>{
    const {Contract} = req.app.get('models')
    const {id} = req.params
    // console.log(id)
    const contract = await Contract.findAll({where: {status: {[Op.ne]:"terminated"}}})
    if(!contract) return res.status(404).end()
    res.json(contract)
})

//get the list of active jobs
app.get('/job/',getProfile, async(req,res)=>{
    const {Job} = req.app.get('models')
    const {Contract} = req.app.get('models')
    // const contract = await Contract.findAll({attributes:['id'], where: {status: {[Op.ne]:"terminated"}}})
    const {id} = req.params
    const job = await Job.findAll({
        include:[
            {
                model: Contract,
                attributes:['id'],
                where: {status: {[Op.ne]:"terminated"}}
            }
        ],
        where: {[Op.and]:[
        {
            paid: true || 1,
            paid: {[Op.ne]:null}
           
        }
    ]}})
    if(!job) return res.status(404).end()
    res.json(job)
})

//make payments to an active job
app.post('/jobs/:job_id/pay', getProfile, async(req,res)=>{
    const {Job} = req.app.get('models')
    const {Contract} = req.app.get('models')
    const {Profile} = req.app.get('models')
    const {job_id} = req.params
    const jobDetails = await Job.findOne({where: {id : job_id}})
    console.log(jobDetails)
    if(!jobDetails) return res.status(404).end()
    const {price, ContractId} = jobDetails
    console.log(price, ContractId)
    const contract = await Contract.findOne({where: {id: ContractId}})
    const {ContractorId, ClientId} = contract
    const clientProfile = await Profile.findOne({where: {id: ClientId}})
    const contractorProfile = await Profile.findOne({where: {id: ContractorId}})
    
    const clientBalance = clientProfile.balance
    const contractorBalance = contractorProfile.balance

    if (clientBalance > price) {
        var newClientBalance = clientBalance - price
        var newContractorBalance = contractorBalance + price
        console.log("Client", newClientBalance, clientBalance)
        console.log("Contractor",newContractorBalance, contractorBalance)
        await Profile.update({balance:newClientBalance}, {
            where:{
                id: ClientId
            }
        })
        await Profile.update({balance:newContractorBalance}, {
            where:{
                id: ContractorId
            }
        })

        await Contract.update({status: "terminated"}, {
            where:{
                id:ContractId
            }
        })
        res.send("Client Payment Confirmed")
    }else{
        res.send("Client Doesn't have enough money")
    }
})

module.exports = app;

// exports.getContractInformation