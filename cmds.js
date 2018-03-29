const Sequelize =require('sequelize');
const {log, biglog, errorlog, colorize} = require("./out");
const {models} = require('./model');

/**
 * Muestra la ayuda.
 */
exports.helpCmd= (socket,rl) => {
    log(socket,"comandos:");
    log(socket,"h|help - muestra esta ayuda.");
    log(socket,"list- listar los quizzes existentes.");
    log(socket,"show <id> - muestra la pregunta y la respuesta del quiz indicado.");
    log(socket,"add - añadir un nuevo quiz interactivamente.");
    log(socket,"delete <id> - Borrar el quiz indicado");
    log(socket,"edit <id> - Editar el quiz indicado");
    log(socket,"test <id> - Probar el quiz indicado");
    log(socket,"p|play - jugar a preguntar aleatoriamente.");
    log(socket,"q|quit - salir del programa.");
    log(socket,"credits - creditos.");
    rl.prompt();
}

exports.listCmd= (socket,rl) => {

    models.quiz.findAll()
        .each(quiz => {
                log(socket,` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
        })
        .catch(error => {
            errorlog(socket,error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

const validateId = id =>{
    return new Sequelize.Promise((resolve, reject) => {
        if (typeof id === "undefined") {
            reject(new Error(`Falta el parametro <id>.`));
        }else {
            id= parseInt(id); //Coger parte entera y descartar lo demás
            if(Number.isNaN(id)){
                reject(new Error(`El valor del parametro <id> no es un número.`));
            }else{
                resolve(id);
            }
        }
    });
};

exports.showCmd= (socket,rl,id) => {

    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id =${id}.`);
            }
            log(socket,`[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(error => {
            errorlog(socket,error.message);
        })
        .then(() => {
            rl.prompt();
        });
};


const makeQuestion =(rl, text) => {
    return new Sequelize.Promise((resolve, reject) => {
        rl.question(colorize(text, 'red'), answer => {
            resolve(answer.trim());
        });
    });
};

exports.addCmd = (socket,rl) => {
    makeQuestion(rl,' Introduzca una pregunta: ')
        .then(q => {
            return makeQuestion(rl, ' Introduzca la respuesta ')
                .then(a => {
                    return {question: q, answer: a};
                });
        })
        .then(quiz=> {
            return models.quiz.create(quiz);
        })
        .then((quiz) => {
            log(socket,`${colorize('Se ha añadido','magenta')}: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
        rl.prompt();
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog(socket,'El quiz es erroneo:');
            error.errors.forEach(({message})=> errorlog(message));
            rl.prompt();
        })
        .catch(error => {
            errorlog(socket,error.message);
        })
        .then(()=> {
            rl.prompt
        });
};




exports.deleteCmd= (socket,rl,id) => {

    validateId(id)
        .then(id => models.quiz.destroy({where: {id}}))
        .catch(error => {
            errorlog(socket,error.message);
        })
            .then(()=> {
                rl.prompt();
            });
};
exports.editCmd= (socket,rl,id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if(!quiz) {
                throw new Error()(`No existe un quiz asociado al id=${id}.`);
            }

            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
            return makeQuestion(rl, 'Introduzca la pregunta: ')
                .then(q=> {
                    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
                    return makeQuestion(rl, 'Introduzca la respuesta: ')
                        .then(a => {
                            quiz.question =q;
                            quiz.answer = a;
                            return quiz;
                        });
                });
            })
            .then(quiz => {
                return quiz.save();
            })
            .then(quiz => {
                log(socket,`Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', ' magenta')} ${quiz.answer}`);
            })
            .catch(Sequelize.ValidationError, error => {
                errorlog(socket,'El quiz es erroneo');
                error.errors.forEach(({message}) => errorlog(message));
            })
            .catch(error=> {
                errorlog(socket,error.message);
            })
            .then(() => {
                rl.prompt();
            });
};

exports.testCmd = (socket,rl, id) => {

    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if(!quiz) {
                throw new Error()(`No existe un quiz asociado al id=${id}.`);
            }

            return makeQuestion(rl, `${quiz.question}: `)
                .then(a => {
                    if(a.toLowerCase().trim()=== quiz.answer.toLowerCase().trim()){
                        log(socket,'Su respuesta es correcta.');
                        biglog(socket,'Correcta', 'green');
                    }
                    else{
                        log(socket,'Su respuesta es incorrecta.');
                        biglog(socket,'Incorrecta', 'red');
                    }
                    rl.prompt();
                    });
                });

};




exports.playCmd = (socket,rl) => {
    let score = 0;

    let toBeResolved = [];

    const playOne = () =>{
       return new Promise((resolve, reject) => {

        if (toBeResolved.length == 0) {
            log(socket,"No hay más preguntas.");
            log(socket,"Fin del examen. Aciertos:");
            biglog(socket,score, "magenta");
            rl.prompt();
        }


            let id_random = Math.floor(Math.random() * toBeResolved.length);
            let quiz = toBeResolved[id_random];
            toBeResolved.splice(id_random, 1);

            return makeQuestion(rl, quiz.question)

                .then(answer => {
                    respuesta = answer.toLowerCase().trim();
                    respuesta2 = quiz.answer.toLowerCase().trim();
                    if (respuesta === respuesta2) {
                        score++;
                        biglog(socket,"Correcto", 'green');
                        log(socket,`CORRECTO - Lleva ${score} aciertos.`);
                        playOne();

                    } else {
                        log(socket,"INCORRECTO.");
                        biglog(socket,"Incorrecto", 'red');
                        log(socket,"Fin del examen. Aciertos:");
                        biglog(socket,score, "magenta");
                        rl.prompt();
                    }
                })
        })
    }
    models.quiz.findAll({raw: true})
        .then(quizzes =>{
            toBeResolved=quizzes;
        })
        .then(()=>{
            return playOne();
        })
        .catch(error => {
            socket.write(error+"\n");
        })
        .then(()=>{
            socket.write(score+"\n");
            rl.prompt();
        })

};


exports.creditsCmd= (socket,rl) => {
    log(socket,'Autores de la práctica:');
    log(socket,'ANA DE LA IGLESIA','green');
    log(socket,'ADRIÁN SIMÓN','green');
    rl.prompt();

}
exports.quitCmd= (socket,rl) => {
    biglog(socket,"¡Adiós!", 'magenta');
    rl.close();
    socket.end();

}