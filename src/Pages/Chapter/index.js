import React, {useEffect, useState} from 'react';
import {View, StyleSheet, Text, FlatList, TouchableOpacity} from 'react-native';
import Tts from 'react-native-tts';
import {BIBLIA_API_KEY} from '@env';
import OptionsMenu from '../../Componentes/OptionsMenu';
import HamburgerMenu from '../../Componentes/HambuguerMenu';
import BooksHandleRequestGet from '../../Componentes/HandleRequest/BooksHandleRequestGet';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import ChapterNavigation from '../../Componentes/ChapterNavigation';

export default function Chapter({route, navigation}) {
  const {name, chapter, abbrev, chapters} = route.params;
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voices, setVoices] = useState([]);
  const [fontSize, setFontSize] = useState(16);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const disponibleVersion = ['acf', 'nvi', 'ra'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const link = `https://www.abibliadigital.com.br/api/verses/nvi/${abbrev.pt}/${chapter}`;
      const result = await BooksHandleRequestGet(link, BIBLIA_API_KEY);
      setVerses(result.verses);
      setLoading(false);
    };

    fetchData();
  }, [abbrev.pt, chapter]);

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const status = await Tts.getInitStatus();
        if (status === 'success') {
          Tts.setDefaultLanguage('pt-BR');
          const availableVoices = await Tts.voices();
          setVoices(availableVoices);
          const portugueseVoice = availableVoices.find(
            voice => voice.language === 'pt-BR' && voice.quality === 'high',
          );
          if (portugueseVoice) {
            Tts.setDefaultVoice(portugueseVoice.id);
          }
        }
      } catch (e) {
        console.error('Error fetching voices', e);
      }
    };

    fetchVoices();
  }, []);

  const speakVerse = text => {
    Tts.stop();
    Tts.speak(text, {
      androidParams: {
        KEY_PARAM_PAN: 0,
        KEY_PARAM_VOLUME: 1,
        KEY_PARAM_STREAM: 'STREAM_MUSIC',
      },
    });
  };

  const speakChapter = () => {
    const chapterText = verses.map(verse => verse.text).join(' ');
    Tts.stop();
    Tts.speak(chapterText, {
      androidParams: {
        KEY_PARAM_PAN: 0,
        KEY_PARAM_VOLUME: 1,
        KEY_PARAM_STREAM: 'STREAM_MUSIC',
      },
    });
  };

  const handleVersionChange = version => async () => {
    setLoading(true);
    const link = `https://www.abibliadigital.com.br/api/verses/${version}/${abbrev.pt}/${chapter}`;
    const result = await BooksHandleRequestGet(link, BIBLIA_API_KEY);
    setVerses(result.verses);
    setLoading(false);
  };

  const increaseFontSize = () => {
    setFontSize(prevFontSize => prevFontSize + 2);
  };

  const decreaseFontSize = () => {
    setFontSize(prevFontSize =>
      prevFontSize > 10 ? prevFontSize - 2 : prevFontSize,
    );
  };

  const toggleOptionsVisibility = () => {
    setOptionsVisible(!optionsVisible);
  };

  const renderVerse = ({item}) => (
    <View style={styles.verseContainer}>
      <Text style={styles.verseNumber}>{item.number}</Text>
      <Text style={[styles.verseText, {fontSize}]}>{item.text}</Text>
      <TouchableOpacity onPress={() => speakVerse(item.text)}>
        <Text style={styles.speakButton}>🔊</Text>
      </TouchableOpacity>
    </View>
  );

  const handlePreviousChapter = () => {
    if (chapter > 1) {
      navigation.push('Chapter', {
        name,
        chapter: chapter - 1,
        abbrev,
        chapters,
      });
    }
  };

  const handleNextChapter = () => {
    if (chapter < chapters) {
      navigation.push('Chapter', {
        name,
        chapter: chapter + 1,
        abbrev,
        chapters,
      });
    }
  };

  const handleSelectChapter = selectedChapter => {
    navigation.push('Chapter', {
      name,
      chapter: selectedChapter,
      abbrev,
      chapters,
    });
  };

  return (
    <View style={styles.container}>
      <HamburgerMenu />
      <OptionsMenu
        disponibleVersion={disponibleVersion}
        handleVersionChange={handleVersionChange}
        speakChapter={speakChapter}
        increaseFontSize={increaseFontSize}
        decreaseFontSize={decreaseFontSize}
        optionsVisible={optionsVisible}
        toggleOptionsVisibility={toggleOptionsVisibility}
      />
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.description}>Capítulo {chapter}</Text>
      {loading ? (
        <SkeletonPlaceholder>
          <SkeletonPlaceholder.Item
            marginBottom={10}
            height={30}
            width="100%"
            borderRadius={5}
          />
          <SkeletonPlaceholder.Item
            marginBottom={10}
            height={30}
            width="100%"
            borderRadius={5}
          />
          <SkeletonPlaceholder.Item
            marginBottom={10}
            height={30}
            width="100%"
            borderRadius={5}
          />
        </SkeletonPlaceholder>
      ) : (
        <FlatList
          data={verses}
          keyExtractor={item => item.number.toString()}
          renderItem={renderVerse}
          contentContainerStyle={styles.versesContainer}
        />
      )}
      <ChapterNavigation
        onPrevious={handlePreviousChapter}
        onNext={handleNextChapter}
        onSelectChapter={handleSelectChapter}
        currentChapter={chapter}
        totalChapters={chapters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  versesContainer: {
    paddingBottom: 20,
  },
  verseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  verseNumber: {
    fontWeight: 'bold',
    marginRight: 10,
    color: '#D43C12',
  },
  verseText: {
    flex: 1,
  },
  speakButton: {
    marginLeft: 10,
    fontSize: 20,
    color: '#007AFF',
  },
});
