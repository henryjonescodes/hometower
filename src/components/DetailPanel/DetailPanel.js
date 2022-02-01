import React, { useEffect, useState } from 'react';
import { Button, DetailBody, DetailContainer, DetailContent, DetailHeader, DetailNav } from './DetailPanelElements';
import {TiArrowBack} from 'react-icons/ti'

const DetailPanel = ({scene, back}) => {
    const [Title, setTitle] = useState("");
    const [Body, setBody] = useState("");
    const [Expanded, setExpanded] = useState(false);

    useEffect(() => {
        if(scene !== null){
            setTitle(scene.content.title)
            setBody(scene.content.body)
            setExpanded(true)
        } else {
            setExpanded(false)
        }

    }, [scene, Body, Title]);
    

    return (
        <DetailContainer Expanded ={Expanded}>
            <DetailContent>
                <DetailNav>
                    <Button onClick={() => {back()}}>
                        <TiArrowBack/>
                    </Button>
                    <DetailHeader>{Title}</DetailHeader>
                </DetailNav>
                <DetailBody>{Body}</DetailBody>
            </DetailContent>
        </DetailContainer>
    );
};

export default DetailPanel;
