import React, { useEffect, useState } from 'react';
import { Container, NavItem, ContentWrapper, ExpandButton, Header, Paragraph} from './ScrollControllerElements';
import {BsChevronDoubleRight} from 'react-icons/bs'

const ScrollController = ({navigate,back}) => {
    const [Expanded, setExpanded] = useState(false);

    const [CurrentSrcroll, setCurrentSrcroll] = useState('');

    function updateScroll(scroll){
        if(CurrentSrcroll === scroll){
            setCurrentSrcroll("")
        }
        setCurrentSrcroll(scroll)
        navigate(CurrentSrcroll)
    }

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
                <NavItem onClick={() => updateScroll('roof')}>
                    <Header>Home</Header>
                    <Paragraph>Overview, Literally!</Paragraph>
                </NavItem>
                <NavItem onClick={() => updateScroll('floor4')}>
                    <Header>About</Header>
                    <Paragraph>Experience | Overview</Paragraph>
                </NavItem>
                <NavItem onClick={() => updateScroll('floor3')}>
                    <Header>Photography</Header>
                    <Paragraph>Online Gallery</Paragraph>
                </NavItem>
                <NavItem onClick={() => updateScroll('floor2')}>
                    <Header>3D Art</Header>
                    <Paragraph>Online Gallery</Paragraph>
                </NavItem>
                <NavItem onClick={() => updateScroll('floor1')}>
                    <Header>Contact</Header>
                    <Paragraph>Social Media | Direct Mail</Paragraph>
                </NavItem>
                <NavItem onClick={() => back()}>
                    <Header>Back</Header>
                </NavItem>
            </ContentWrapper>
            <ExpandButton onClick={toggle}>
                <BsChevronDoubleRight/>
            </ExpandButton>
        </Container>
    ) 
      
};

export default ScrollController;
