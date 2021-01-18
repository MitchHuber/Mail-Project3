document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  var sentEmail = localStorage.getItem('emailSent');
  console.log(sentEmail);
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
          const sent = document.createElement('div');
          sent.innerHTML = (`To: ${email.recipients} <br> ${email.subject} <br> ${email.timestamp}`);
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
            sent.innerHTML = (`From: ${email.sender} <br> ${email.subject} <br> ${email.timestamp}`);
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
            archived.innerHTML = (`From: ${email.sender} <br> ${email.subject} <br> ${email.timestamp}`);
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
    const replyBtn = document.createElement('button');
    const archiveBtn = document.createElement('button');
    replyBtn.innerHTML = "Reply";

    if(data.archived == true){
      archiveBtn.innerHTML = "Unarchive";
      email.innerHTML = (`From : ${data.sender} <br> To: ${data.recipients} <br>
        ${data.timestamp} <br>  Subject: ${data.subject} <br> Body: ${data.body}`);
      document.querySelector('#email').append(email);
      document.querySelector('#email').append(archiveBtn);

      archiveBtn.addEventListener('click', () => unarchive(data.id));
    }
    else {
      archiveBtn.innerHTML = "Archive";
      email.innerHTML = (`From : ${data.sender} <br> To: ${data.recipients} <br>
        ${data.timestamp} <br>  Subject: ${data.subject} <br> Body: ${data.body}`);
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
  load_mailbox('inbox');
}

function unarchive(id){
  fetch(`emails/${id}`,{
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  })
  location.reload();
  load_mailbox('inbox');
}

function reply(email){
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email').style.display = 'none';

  document.querySelector('#compose-recipients').value = email.sender;
  document.querySelector('#compose-subject').value  = (`RE: ${email.subject}`);
  document.querySelector('#compose-body').value = (`On ${email.timestamp} ${email.sender} wrote: ${email.body}`);

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
    sendEmail();
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
    .then(response => response.json())
    .then(result => {
      localStorage.setItem('emailSent', true);
    })
    .catch(error => {
      console.log("error", error);
    });
}