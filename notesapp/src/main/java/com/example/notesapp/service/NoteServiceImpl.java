package com.example.notesapp.service;

import com.example.notesapp.entity.Note;
import com.example.notesapp.repository.NoteRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NoteServiceImpl implements NoteService {

    private final NoteRepository repository;

    public NoteServiceImpl(NoteRepository repository) {
        this.repository = repository;
    }

    @Override
    public Note createNote(Note note) {
        return repository.save(note);
    }

    @Override
    public List<Note> getAllNotes() {
        return repository.findAll();
    }

    @Override
    public Note getNoteById(Long id) {
        return repository.findById(id).orElseThrow();
    }

    @Override
    public Note updateNote(Long id, Note note) {
        Note existing = repository.findById(id).orElseThrow();
        existing.setTitle(note.getTitle());
        existing.setContent(note.getContent());
        return repository.save(existing);
    }

    @Override
    public void deleteNote(Long id) {
        repository.deleteById(id);
    }
}
