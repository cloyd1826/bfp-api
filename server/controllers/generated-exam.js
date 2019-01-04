const JWT = require('jsonwebtoken');
const Model = require('../models/generated-exam');
const User = require('../models/user')
const { JWT_SECRET } = require('../configuration');

module.exports = {
  add: async (req, res, next) => {
    console.log(req.body)
    const data = new Model(req.body)
    const save = await data.save() 
    
    res.json({ data: save });
  },
  fetchAll: async (req, res, next) => {
    let findQuery = {}
    if(req.query){
      let query = req.query
      if(query.examiner){
        findQuery = {...findQuery, examiner: query.examiner}
      }
      if(query.level){
        findQuery = {...findQuery, level: query.level }
      }
      if(query.status){
        findQuery = {...findQuery, status: query.status }
      }
    }
    const count = await Model.find(findQuery).populate([{path:"level"},{path:"examType"},{path:"examiner"},{path:"exam.question"},{path:"exam.question.learningStrand"}]).count().exec()
    const pageCount = Math.ceil(count / 10)
    const skip = (parseInt(req.query.page) - 1) * 10
    const find = await Model.find(findQuery).populate([{path:"level"},{path:"examType"},{path:"examiner"},{path:"exam.question"},{path:"exam.question.learningStrand"}]).skip(skip).limit(10).exec()
      res.json({
        data: find,
        currentPage: parseInt(req.query.page),
        previousPage: (parseInt(req.query.page) - 1 <= 0 ? null : parseInt(req.query.page) - 1),
        nextPage: (parseInt(count) > 10 && parseInt(req.query.page) != pageCount ? parseInt(req.query.page) + 1 : null ),
        perPage: 10,
        pageCount: pageCount,
        totalCount: count
    })
   
  },
  fetchSingle: async (req, res, next) => {
    const find = await Model.findOne({_id:req.params.id}).populate([{path:"level"},{path:"examType"},{path:"examiner"},{path:"exam.question"}]).exec()
    res.json({data: find})
  },
  // examType: {
  //   type: Schema.Types.ObjectId,
  //   ref: 'examType'
  // }
  // score: Number,
  // percentagePerLearningStrand:[
  //   {
  //     learningStrand: { 
  //       type: Schema.Types.ObjectId,
  //       ref: 'learningStrand'
  //     },
  //     percentage: Number,
  //     score: Number,
  //     totalQuestion: Number
  //   }
  // ],
  // type: String,
  // examiner: {
  //   type: Schema.Types.ObjectId,
  //   ref: 'user'
  // },
  // dateStarted
  // dateFinished
  // status: String, //completed, pending, 
  // timeRemaining: String
  fetchAnalyticsOfPassers: async( req, res, next ) => {
    const count = await User.find({"local.userType":req.query.userType}).count().exec() // userType is yung sa Learner
    //fetch natin yung mga nakapasa na. Per examType. Siguro naka donut to. Para ex. 60% passed out of 40% ongoing
    const find = await Model.find({examType:req.query.examType,status:req.query.status}).populate([{path:"level"},{path:"examType"},{path:"examiner"},{path:"exam.question"}]).exec()
    res.json({data: find, totalLearner: count})
  },
  fetchAnalyticsOfPerLearner: async( req, res, next ) => {
    // Display mo sa Pre-Test ay Percentage lang.
    // Display mo sa Adaptive yung Graph. Kung nakailang take. tapos kung pataas ba ang percentage nya.
    // Same sa Adaptive yung sa POST
    const find = await Model.find({examType:req.query.examType,status:req.query.status,examiner: req.query.examiner}).populate([{path:"level"},{path:"examType"},{path:"examiner"},{path:"exam.question"}]).exec()
    res.json({data: find})
  },

  fetchCountOfExamType: async( req, res, next ) => {
   
    const completed = await Model.find({examType:req.query.examType,status:'Completed'}).populate([{path:"level"},{path:"examType"},{path:"examiner"},{path:"exam.question"}]).count().exec()
    const retake = await Model.find({examType:req.query.examType,status:'Retake'}).populate([{path:"level"},{path:"examType"},{path:"examiner"},{path:"exam.question"}]).count().exec()
    const pending = await Model.find({examType:req.query.examType,status:'Pending'}).populate([{path:"level"},{path:"examType"},{path:"examiner"},{path:"exam.question"}]).count().exec()
    const total = await Model.find({examType:req.query.examType}).populate([{path:"level"},{path:"examType"},{path:"examiner"},{path:"exam.question"}]).count().exec()

    res.json({completed: completed, retake: retake, pending: pending, total: total})
  },


  checkStatus: async (req, res, next) => {
    const find = await Model.find({examiner:req.params.examiner, "status": {$eq: "Pending"}}).populate([{path:"level"},{path:"examType"},{path:"examiner"},{path:"exam.question"}]).exec()
    res.json({data: find})
  },
  delete: async (req, res, next) => {
    const remove = await Model.remove({_id:req.params.id}).exec()
    res.json({message: "Deleted!"})
  },
  update: async (req, res, next) => {
    const data = req.body
    const update = await Model.findOneAndUpdate({_id:req.params.id},{$set:data}).exec()
    res.json({data: update})
  }
}