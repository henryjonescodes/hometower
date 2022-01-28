import React, { useState } from 'react';
import { Container, NavItem, ContentWrapper, ExpandButton, Header, Paragraph} from './ScrollControllerElements';
import {BsChevronDoubleRight} from 'react-icons/bs'

const ScrollController = ({navigate,back}) => {
    const [Expanded, setExpanded] = useState(false);

    //Handle detail panel expansion
    function toggle(){
        setExpanded(!Expanded)
    }
    return(
        <Container Expanded ={Expanded}>
            <ContentWrapper>
                <NavItem onClick={() => navigate('roof')}>
                    <Header>Home</Header>
                    <Paragraph>Overview, Literally!</Paragraph>
                </NavItem>
                <NavItem onClick={() => navigate('floor4')}>
                    <Header>About</Header>
                    <Paragraph>Experience | Overview</Paragraph>
                </NavItem>
                <NavItem onClick={() => navigate('floor3')}>
                    <Header>Photography</Header>
                    <Paragraph>Online Gallery</Paragraph>
                </NavItem>
                <NavItem onClick={() => navigate('floor2')}>
                    <Header>3D Art</Header>
                    <Paragraph>Online Gallery</Paragraph>
                </NavItem>
                <NavItem onClick={() => navigate('floor1')}>
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
