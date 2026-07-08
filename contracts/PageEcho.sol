// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PageEcho {
    uint256 public nextNoteId = 1;

    struct PageNote {
        address reader;
        string book;
        string pageRef;
        string mood;
        string note;
        uint256 createdAt;
    }

    mapping(uint256 => PageNote) private notes;

    event NoteSaved(
        uint256 indexed noteId,
        address indexed reader,
        string book,
        string pageRef,
        string mood
    );

    function saveNote(
        string calldata book,
        string calldata pageRef,
        string calldata mood,
        string calldata note
    ) external returns (uint256 noteId) {
        require(bytes(book).length > 0 && bytes(book).length <= 48, "Invalid book");
        require(bytes(pageRef).length > 0 && bytes(pageRef).length <= 18, "Invalid page");
        require(bytes(mood).length > 0 && bytes(mood).length <= 18, "Invalid mood");
        require(bytes(note).length > 0 && bytes(note).length <= 220, "Invalid note");

        noteId = nextNoteId++;
        notes[noteId] = PageNote({
            reader: msg.sender,
            book: book,
            pageRef: pageRef,
            mood: mood,
            note: note,
            createdAt: block.timestamp
        });

        emit NoteSaved(noteId, msg.sender, book, pageRef, mood);
    }

    function getNote(
        uint256 noteId
    )
        external
        view
        returns (
            address reader,
            string memory book,
            string memory pageRef,
            string memory mood,
            string memory note,
            uint256 createdAt
        )
    {
        PageNote storage entry = notes[noteId];
        return (
            entry.reader,
            entry.book,
            entry.pageRef,
            entry.mood,
            entry.note,
            entry.createdAt
        );
    }
}
