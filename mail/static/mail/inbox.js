document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  var sentEmail = localStorage.getItem('emailSent');
  if(sentEmail == 'true'){
    load_mailbox('sent');
    localStorage.setItem('emailSent', false);
  }else{
    load_mailbox('inbox');
  }
});

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  if(mailbox === 'sent'){
    fetch('/emails/sent')
    .then(response => response.json())
    .then(data => {
      if (data == 0) {
        const check = document.createElement('div');
        check.innerHTML = (`You haven't sent any emails yet.`);
        document.querySelector('#emails-view').append(check);
      }
      else {
        data.forEach(email => {
          let time = convertTime(email.timestamp);
          const sent = document.createElement('div');
          sent.innerHTML = (`<b>From:</b> ${email.sender} <br> <b>Subject:</b> ${email.subject} <br> <b>Time:</b> ${time}`);
          sent.addEventListener('click', () => {
            console.log(`${email.id} was clicked!`);
          });
          document.querySelector('#emails-view').append(sent);
        });
      }
    });
  }
  else if (mailbox === 'inbox'){
    fetch('/emails/inbox')
    .then(response => response.json())
    .then(data => {
      if (data == 0) {
        const check = document.createElement('div');
        check.innerHTML = "You haven't recieved any emails yet.";
        document.querySelector('#emails-view').append(check);
      }
      else {
        data.forEach(email => {
          if (email.archived == false) {
            const sent = document.createElement('div');
            if (email.read == true){
              sent.style.backgroundColor = 'gainsboro';
            }
            let time = convertTime(email.timestamp);
            sent.innerHTML = (`<b>From:</b> ${email.sender} <br> <b>Subject:</b> ${email.subject} <br> <b>Time:</b> ${time}`);
            sent.addEventListener('click', () => {
              viewEmail(email);
            });
            document.querySelector('#emails-view').append(sent);
          }
        });
      }
    });
  }
  else if (mailbox === 'archive'){
    fetch('/emails/archive')
    .then(response => response.json())
    .then(data => {
      if (data == 0){
        const check = document.createElement('div');
        check.innerHTML = "You haven't archived any emails yet.";
        document.querySelector('#emails-view').append(check);
      }
      else {
        data.forEach(email => {
          const archived = document.createElement('div');
          if (email.archived == true) {
            let time = convertTime(email.timestamp);
            archived.innerHTML = (`<b>From:</b> ${email.sender} <br> <b>Subject:</b> ${email.subject} <br> <b>Time:</b> ${time}`);
            archived.addEventListener('click', () => {
              viewEmail(email);
            });
            document.querySelector('#emails-view').append(archived);
          }
        });
      }
    });
  }
}

function viewEmail(email){
  //Change display properties accordingly
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email').style.display = 'block';

  //Clears out the div of other emails
  document.querySelector('#email').innerHTML = '';

  //Changes the read property for the email
  fetch(`emails/${email.id}`,{
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
  //Displays email info and creates the buttons to reply/archive
  fetch(`emails/${email.id}`)
  .then(response => response.json())
  .then(data => {
    const email = document.createElement('div');
    const from = document.createElement('section');
    const to = document.createElement('section');
    const timestamp = document.createElement('section');
    const subject = document.createElement('section');
    const body = document.createElement('section');
    const replyBtn = document.createElement('button');
    const archiveBtn = document.createElement('button');
    let time = convertTime(data.timestamp);
    replyBtn.innerHTML = "Reply";
    email.className = "border-bottom"
    replyBtn.className = "btn btn-outline-primary";
    archiveBtn.className = "btn btn-outline-primary"
    archiveBtn.innerHTML = "Unarchive";
    from.innerHTML = (`<b>From:</b> ${data.sender}`);
    to.innerHTML = (`<b>To:</b> ${data.recipients}`);
    timestamp.innerHTML = (`<b>Time:</b> ${time}`);
    subject.innerHTML = (`<b>Subject:</b> ${data.subject}`);
    body.innerHTML = (`<b>Body:</b> ${data.body}`);
  
    if(data.archived == true){

      document.querySelector('#email').append(from);
      document.querySelector(`#email`).append(to);
      document.querySelector(`#email`).append(timestamp);
      document.querySelector(`#email`).append(subject);
      document.querySelector(`#email`).append(body);
      document.querySelector('#email').append(email);
      document.querySelector('#email').append(archiveBtn);

      archiveBtn.addEventListener('click', () => unarchive(data.id));
    }
    else {

      archiveBtn.innerHTML = "Archive";
      document.querySelector('#email').append(from);
      document.querySelector(`#email`).append(to);
      document.querySelector(`#email`).append(timestamp);
      document.querySelector(`#email`).append(subject);
      document.querySelector(`#email`).append(body);
      document.querySelector('#email').append(email);
      document.querySelector('#email').append(archiveBtn);
      document.querySelector('#email').append(email);
      document.querySelector('#email').append(replyBtn);
      document.querySelector('#email').append(archiveBtn);
      
      archiveBtn.addEventListener('click', () => archive(data.id));

      replyBtn.addEventListener('click', () => reply(data));
    }
  });
}

function archive(id){
  fetch(`emails/${id}`,{
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    })
  })
  location.reload();
}

function unarchive(id){
  fetch(`emails/${id}`,{
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  })
  location.reload();
}

function reply(email){
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email').style.display = 'none';

  let time = convertTime(email.timestamp);
  document.querySelector('#compose-recipients').value = email.sender;
  if(email.subject.search("RE:") == 0){
    fetch('/emails/sent')
    .then(response => response.json())
    .then(sent => {
      for(let i = 0; i < sent.length; i++){
        console.log(sent[i]);
        console.log(email);
        if(email.body.includes(convertTime(sent[i].timestamp))){
          let first = email.body.lastIndexOf(sent[i].body) + sent[i].body.length;
          let initialMessage = `${email.body.slice(0, first)}` + '\n';
          let response = email.body.slice((first + 1), -1);
          let format = '\n' + `On ${convertTime(email.timestamp)} ${email.sender} wrote: ${response.trim()}`;

          document.querySelector('#compose-subject').value  = (`${email.subject}`);
          document.querySelector('#compose-body').value = (initialMessage + format);
        }
    }

    document.querySelector('#sendBtn').addEventListener('click', () => {
      sendEmail();
    });
  });
  }
  else{
    document.querySelector('#compose-subject').value  = (`RE: ${email.subject}`);
    document.querySelector('#compose-body').value = (`On ${time} ${email.sender} wrote: ${email.body}`);
    
    document.querySelector('#sendBtn').addEventListener('click', () => {
      sendEmail();
    });
  }
}
function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email').style.display = 'none';


  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#sendBtn').addEventListener('click', () => {
    let user = document.getElementById('user').value;
    let recipient = document.getElementById('compose-recipients').value;
    let subject = document.getElementById('compose-subject').value;
    let body = document.getElementById('compose-body').value

    if(recipient === user){
      alert(`You're not able to send an email to yourself`);
    }
    else if(body.length == 0){
      alert(`The body can't be left blank.`)
    }
    else if(subject.length == 0){
      var subjectless = confirm('This email has no subject, send anyways?');
        if(subjectless){
          sendEmail();
        }
        else{
        }
    }
    else{
      sendEmail();
    }
  });
}

function sendEmail(){
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
    .then(response => {
      if(response.status == 400){
        alert('There are no users with that email address.')
      }
      else{
        localStorage.setItem('emailSent', true);
        location.reload();
      }
    })
    .catch(error => {
      console.log("error", error);
    });
}

function convertTime(time){
  let timeStamp = new Date(time);
  let month = timeStamp.getMonth();
  switch(month){
    case 0:
      month = "Jan"
      break;
    case 1: 
      month = "Feb"
      break;
    case 2: 
      month = "Mar"
      break;
    case 3: 
      month = "Apr"
      break;
    case 4: 
      month = "May"
      break;
    case 5: 
      month = "Jun"
      break;
    case 6: 
      month = "Jul"
      break;
    case 7: 
      month = "Aug"
      break;
    case 8: 
      month = "Sep"
      break;
    case 9: 
      month = "Oct"
      break;
    case 10:
      month = "Nov"
      break;
    default:
      month = "Dec"
  }

  timeStamp.setHours(timeStamp.getHours() - (timeStamp.getTimezoneOffset() / 60));
  
  if(timeStamp.getHours() > 13){
    timeStamp.setHours(timeStamp.getHours() - 12);
  }

  let minutes = timeStamp.getMinutes();
  if(timeStamp.getMinutes() < 10){
    minutes = `0${minutes}`
  }
  
  let ampm = ``;
  if((timeStamp.getHours() + 12) < 12){
    ampm = 'AM'
  }
  else{
    ampm = 'PM'
  }
  return `${month} ${timeStamp.getDate()} ${timeStamp.getFullYear()}, ${timeStamp.getHours()}:${minutes} ${ampm}`;
}