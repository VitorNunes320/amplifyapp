import React, { useState, useEffect } from 'react';
import './App.css';
import { API, Storage, Auth } from 'aws-amplify';
import { withAuthenticator, Authenticator } from '@aws-amplify/ui-react';
import { listTodos } from './graphql/queries';
import { createTodo as createNoteMutation, deleteTodo as deleteNoteMutation } from './graphql/mutations';

import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Divider from '@material-ui/core/Divider';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from "@material-ui/icons/Add";
import TextField from '@material-ui/core/TextField';
import Box from '@material-ui/core/Box';
import { Fab } from "@material-ui/core";
import PhotoCamera from '@material-ui/icons/PhotoCamera';


const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    maxWidth: '36ch',
    backgroundColor: theme.palette.background.paper,
    margin: theme.spacing(3),
  },
  itens: {
    width: '90%',
    margin: '10px',
    padding: '10px',
  },
  inline: {
    display: 'inline',
  },
  input: {
    display: 'none',
  },
  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: '25ch',
    color: "#2882F8",
  },
  div: {
    color: "#FFF",
    backgroundColor: "#f29316",
    margin: '10px',
    marginBottom: '20px',
    padding: '15px',
  },
  campos: {
    margin: '10px',
    padding: '10px',
  },
  camera: {
    color: "#f29316",
  }
}));


const initialFormState = { name: '', description: '' }

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listTodos });
    const notesFromAPI = apiData.data.listTodos.items;
    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))
    setNotes(apiData.data.listTodos.items);
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

  function signOut() {
    Auth.signOut()
    .then(data => console.log(data))
    .catch(err => console.log(err));
  }

  const classes = useStyles();
  
  return (
    
    <div className="App">
      <Box boxShadow={4} width="auto">
      <div className={classes.div}>
      <Typography variant="h4" component="h4" >
        Listagem de notas
      </Typography>
      </div>
      <div className={classes.campos}>
         <TextField 
            id="filled-basic" 
            label="Título"
            variant="filled" 
            className={classes.textField}
            onChange={e => setFormData({ ...formData, 'name': e.target.value})}
            placeholder="Título"
            value={formData.name}
          />

         <TextField 
            id="filled-basic" 
            label="Descrição"
            variant="filled" 
            className={classes.textField}
            onChange={e => setFormData({ ...formData, 'description': e.target.value})}
            placeholder="Descrição"
            value={formData.description}
          />

        <input accept="image/*" className={classes.input} id="icon-button-file" type="file" onChange={onChange}/>
        <label htmlFor="icon-button-file">
          <IconButton className={classes.camera} aria-label="upload picture" component="span">
            <PhotoCamera />
          </IconButton>
        </label>    
        <Fab 
          className={classes.camera}
          size="small" 
          component="span" 
          aria-label="add" 
          onClick={createNote}
          >
          <AddIcon />
        </Fab>
      </div>
     
          <List className={classes.itens}>
          <Grid item xs={12} md={12}>         
          {
            notes.map(note => (
              <div key={note.id || note.name}>
              <ListItem alignItems="flex-start">
              
                  <ListItemAvatar>
                  {
                    note.image &&
                  <Avatar  src={note.image} alt=""/>
                  }
                  </ListItemAvatar>

                  <ListItemText
                    primary={note.name}
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          className={classes.inline}
                          color="textPrimary"
                        >
                          {note.description}
                        </Typography>
                        
                      </React.Fragment>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="delete" onClick={() => deleteNote(note)} variant="contained" color="secondary">
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
              </ListItem>
              <Divider variant="inset" component="li" /> 
            </div>
            ))
          }
          </Grid>
          </List>
        <button onClick={signOut} className="signOutButton">SignOut</button>
        <Authenticator/>
     </Box>
    </div>
    
  );
}

export default withAuthenticator(App);