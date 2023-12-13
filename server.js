const express = require('express');
const app = express()
const OpenAI = require('openai');
var cors = require('cors')
const mysql = require('mysql2');
require('dotenv').config();
const apiKey = process.env.API_KEY
const openai = new OpenAI({
    apiKey: apiKey
  });
  
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

const connection = mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: process.env.DB_PASSWORD, 
    database: 'reactproject',
  });

app.listen(process.env.PORT, () => {
    console.log(`http://localhost:${process.env.PORT}`)
})

app.get('/', async (요청, 응답) => {
    응답.send('asdf')
})

app.post('/login', async (요청, 응답) => { //before start
    console.log(요청.body)
    connection.connect((err) => {
        if (err) {
          console.error('MySQL 연결 실패: ', err);
          응답.status(500).json({ message: 'MySQL 연결 실패' });
        } else {
          console.log('MySQL 연결 성공');
          connection.query(  'INSERT INTO users (nickname, gender, job) VALUES (?, ?, ?)',
          [요청.body.nickname, 요청.body.gender, 요청.body.job], 
          (error, results, fields) => {
            if (error) {
              console.error('쿼리 실행 오류:', error);
              응답.status(500).json({ message: '쿼리 실행 오류' });
            } else {
              console.log('데이터 삽입 성공');
              console.log(results)
              응답.status(200).json({ message: '데이터 삽입 성공' });
            }
          });
        }
      });
})
app.post('/answer', async(요청, 응답)=> { // 답변 저장
    console.log(요청.body)
        connection.connect((err) => {
        if (err) {
          console.error('MySQL 연결 실패: ', err);
          응답.status(500).json({ message: 'MySQL 연결 실패' });
        } else {
          console.log('MySQL 연결 성공!');
          connection.query(  'INSERT INTO userAnswer (nickname, answer) VALUES (?, ?)',
          [요청.body.nickname, 요청.body.answer], 
          (error, results, fields) => {
            if (error) {
              console.error('쿼리 실행 오류:', error);
              응답.status(500).json({ message: '쿼리 실행 오류' });
            } else {
              console.log('데이터 삽입 성공');
              console.log(results)
              응답.status(200).json({ message: '데이터 삽입 성공' });
            }
          });
        //   connection.end();
        }
      });
})

app.post('/interview', async (요청, 응답) => {
    console.log(요청.body)

    let {userMessages, assistantMessages} = 요청.body
    console.log(userMessages)
    let messages = [
        { role: 'system', content: '당신은 세계 최고의 인공지능 면접관 입니다. 당신은 제가 희망하는 기업의 면접관이 되어서 적절한 면접 질문을 해야 합니다. 당신은 면접에서 자주 출제되는 핵심적이고 기술적인 질문을 준비합니다. 면접의 진행 방식은 다음과 같습니다. 첫 번째 질문을 하고 채팅을 전송 합니다. 저의 첫 번째 대답을 받아야 지만 다음 두 번째 질문을 할 수 있습니다. 이렇게 순차적인 방식으로 진행합니다. 두 번째 질문을 물어봤다면 저의 부족한 부분을 기술적으로 피드백을 해주면서 "면접은 여기서 마무리 하겠습니다. 수고하셨습니다."라고 마지막 말을 붙인 뒤 면접을 종료 합니다. 먼저 저에게 희망하는 직업이나 직무가 무엇인지 질문해 주세요. 절대로 한번에 준비 된 질문을 동시에 하면 안됩니다.' },
        { role: 'user', content: '당신은 세계 최고의 인공지능 면접관 입니다. 당신은 제가 희망하는 기업의 면접관이 되어서 적절한 면접 질문을 해야 합니다. 당신은 면접에서 자주 출제되는 핵심적이고 기술적인 질문을 준비합니다. 면접의 진행 방식은 다음과 같습니다. 첫 번째 질문을 하고 채팅을 전송 합니다. 저의 첫 번째 대답을 받아야 지만 다음 두 번째 질문을 할 수 있습니다. 이렇게 순차적인 방식으로 진행합니다. 두 번째 질문을 물어봤다면 저의 부족한 부분을 기술적으로 피드백을 해주면서 "면접은 여기서 마무리 하겠습니다. 수고하셨습니다."라고 마지막 말을 붙인 뒤 면접을 종료 합니다. 먼저 저에게 희망하는 직업이나 직무가 무엇인지 질문해 주세요. 절대로 한번에 준비 된 질문을 동시에 하면 안됩니다.'},
        { role: 'assistant', content:"안녕하세요! 저는 인공지능 면접관입니다. 당신이 희망하는 직업이나 직무가 무엇인지 알려주시겠어요? 그러면 해당 직무에 관련된 첫 번째 면접 질문을 준비해 드릴게요."}
    ]
    while (userMessages.length != 0 || assistantMessages.length !=0){
        if (userMessages.length != 0){
            messages.push(
                JSON.parse('{ "role": "user", "content": "'+String(userMessages.shift()).replace(/\n/g,"")+'"}')
            )
        }
        if (assistantMessages != 0){
            messages.push(
                JSON.parse('{ "role": "assistant", "content": "'+String(assistantMessages.shift()).replace(/\n/g,"")+'"}')
            )
        }
    }

    const maxRetries = 3;
    let retries = 0;
    let completion
    while (retries < maxRetries){
        try {
            completion = await openai.chat.completions.create({
                messages: messages,
                model: 'gpt-3.5-turbo',
                temperature: 0.8,
                max_tokens: 256,
            });
            break;
        } catch (error) {
            retries ++;
            console.log(error)
            console.log(`Error fetching data, retrying (${retries}/${maxRetries})...`)
        }
    }
    let interview = completion.choices[0].message['content']
    console.log(interview)
    응답.json(interview)

});