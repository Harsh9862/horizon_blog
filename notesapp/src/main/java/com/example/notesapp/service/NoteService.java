package com.example.notesapp.service;

import com.example.notesapp.entity.Note;
import java.util.List;

public interface NoteService {

    Note createNote(Note note);

    List<Note> getAllNotes();

    Note getNoteById(Long id);

    Note updateNote(Long id, Note note);

    void deleteNote(Long id);
}
