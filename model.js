const Sequelize = require('sequelize');

const sequelize = new Sequelize("sqlite:quizzes.sqlite", {logging: false});

sequelize.define('quiz',{
    question: {
        type: Sequelize.STRING,
        unique: {msg: "Ya existe esta pregunta"},
        validate: {notEmpty: {msg: "La pregunta no puede estar vacia"}}
    },
    answer: {
        type: Sequelize.STRING,
        validate: {notEmpty: {msg: "La respuesta no puede estar vacia"}}
    }
});

sequelize.sync()
    .then(()=>sequelize.models.quiz.count())
    .then(count=>{
        if(!count){
            return sequelize.models.quiz.bulkCreate([
                {question: "Capital de Italia? ", answer: "Roma"},
                {question: "Capital de España? ", answer: "Madrid"},
                {question: "Capital de Portugal? ", answer: "Lisboa"},
                {question: "1+1= ", answer: "2"},
                {question: "cuent cent hay mit de med eur? ", answer: "25"}
            ]);
        }
    })
    .catch(error=>{
        console.log(error);
    });
module.exports=sequelize;
