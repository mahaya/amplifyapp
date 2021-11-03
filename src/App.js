import React, { useState, useEffect } from 'react';
import './App.css';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';
import { API, Storage } from 'aws-amplify';

const initialFormState = { name: '', description: '' }
const mystyle = {
  color: "black",
  backgroundColor: "DodgerBlue",
  padding: "10px",
  fontFamily: "Arial",
  textAlign: "left",
  width: "80%"
};

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  return (
    <div className="App" style={mystyle}>
      <img src={"https://www.mutualofamerica.com/Scripts/MoaCommon/css/images/Masthead.png"}></img>
      <h1 color={"black"}>Relationship Tracking Database Update App</h1>
      <table>
      <tr>
      <td width={"25%"}>
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Participant ID"
        value={formData.name}
      />
      </td>
      <td width={"25%"}>
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Status"
        value={formData.description}
      />
      </td>
      <td width={"25%"}>
      <input
        onChange={e => setFormData({ ...formData, 'ssn': e.target.value})}
        placeholder="SSN"
        value={formData.ssn}
      />
      </td>
      {/* <td>
      <input
        type="file"
        onChange={onChange}
      />
      </td> */}
      
      <td width={"25%"}>
      <button onClick={createNote}>Update Status</button>
      </td>
      </tr>
      </table>
      <div style={{marginBottom: 30}}>
      {
        notes.map(note => (
          <div key={note.id || note.name}>
            <table style={mystyle}>
            <tr>
            <td width={"25%"}>{note.name}</td>
            <td width={"25%"}>{note.description}</td>
            <td width={"25%"}>{note.ssn}</td>     
            <td width={"25%"}><button onClick={() => deleteNote(note)}>Delete Record</button></td>
            </tr>
            </table>
          </div>
        ))
      }
      </div>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);
//export default App;