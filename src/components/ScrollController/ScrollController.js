import React, { useEffect, useState } from 'react';
import { Container, NavItem, ContentWrapper, ExpandButton, Header, Paragraph} from './ScrollControllerElements';
import {BsChevronDoubleRight} from 'react-icons/bs'

const ScrollController = ({navigate}) => {
    const [Expanded, setExpanded] = useState(false);

    const [CurrentSrcroll, setCurrentSrcroll] = useState('about');

    useEffect(() => {
      navigate(CurrentSrcroll)
    }, [CurrentSrcroll]);
    
 
    //Handle detail panel expansion
    function toggle(){
        setExpanded(!Expanded)
    }
    return(
        <Container Expanded ={Expanded}>
            <ContentWrapper>
                <NavItem onClick={() => setCurrentSrcroll('about')}>
                    <Header>About</Header>
                    <Paragraph>Experience | Overview</Paragraph>
                </NavItem>
                <NavItem onClick={() => setCurrentSrcroll('gallery')}>
                    <Header>3D Art</Header>
                    <Paragraph>Online Gallery</Paragraph>
                </NavItem>
                <NavItem onClick={() => setCurrentSrcroll('photos')}>
                    <Header>Photography</Header>
                    <Paragraph>Online Gallery</Paragraph>
                </NavItem>
                <NavItem onClick={() => setCurrentSrcroll('contact')}>
                    <Header>Contact</Header>
                    <Paragraph>Social Media | Direct Mail</Paragraph>
                </NavItem>
            </ContentWrapper>
            <ExpandButton onClick={toggle}>
                <BsChevronDoubleRight/>
            </ExpandButton>
        </Container>
    ) 
      
};

export default ScrollController;
